import test from 'node:test';
import assert from 'node:assert/strict';
import { validateListingDraft, toListingInput } from '../src/lib/listingDraft.ts';
import { referenceCache } from '../src/lib/referenceCache.ts';
import { sourceModificationDate } from '../scripts/page-revisions.mjs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const cities = [{id:'sofia'}, {id:'varna'}];
const neighborhoods = [{id:'s-hood',cityId:'sofia'}, {id:'v-hood',cityId:'varna'}];
const universities = [{id:'s-uni',cityId:'sofia'}, {id:'v-uni',cityId:'varna'}];
const base = {
  cityId:'sofia', neighborhoodId:'', universityIds:[], type:'studio',
  title:'Светло студио под наем', description:'Жилището има отделна кухня и удобен градски транспорт. Огледи по уговорка.',
  price:'450.50', area:'38', rooms:'1', floor:'0', totalFloors:'5', deposit:'0',
  availableFrom:'2026-10-10', furnished:true, pets:false, utilities:false,
};
const validate = (draft,step=1,photos=1) => validateListingDraft(draft,step,cities,neighborhoods,universities,photos);

test('city-only publishing works, while a typed unknown city does not', () => {
  assert.equal(validate(base,0),null);
  assert.equal(validate({...base,cityId:'uncommitted-query'},0)?.field,'nf-city');
});
test('neighborhoods and universities from another city are rejected', () => {
  assert.equal(validate({...base,neighborhoodId:'v-hood'},0)?.field,'nf-neighborhood');
  assert.equal(validate({...base,universityIds:['v-uni']},0)?.field,'nf-university');
  assert.equal(validate({...base,neighborhoodId:'s-hood',universityIds:['s-uni']},0),null);
});
test('university selection cannot contain duplicates or exceed three', () => {
  assert.equal(validate({...base,universityIds:['s-uni','s-uni']},0)?.field,'nf-university');
  assert.equal(validate({...base,universityIds:['s-uni','s-uni','s-uni','s-uni']},0)?.field,'nf-university');
});
test('real calendar dates are checked, including leap days', () => {
  assert.equal(validate({...base,availableFrom:'2026-02-30'})?.field,'nf-available');
  assert.equal(validate({...base,availableFrom:'2026-02-29'})?.field,'nf-available');
  assert.equal(validate({...base,availableFrom:'2028-02-29'}),null);
});
test('invalid money, fractional rooms and contradictory floors are rejected', () => {
  for (const price of ['0','-1','Infinity','NaN','100000000','450.505']) assert.equal(validate({...base,price})?.field,'nf-price');
  assert.equal(validate({...base,rooms:'1.5'})?.field,'nf-rooms');
  assert.equal(validate({...base,floor:'6',totalFloors:'5'})?.field,'nf-total-floors');
  assert.equal(validate({...base,deposit:'-1'})?.field,'nf-deposit');
  assert.equal(validate({...base,area:'1000000'})?.field,'nf-area');
  assert.equal(validate({...base,area:'38.001'})?.field,'nf-area');
  assert.equal(validate({...base,price:'99.99',deposit:'99.99',area:'38.25'}),null);
});
test('phone and email stay outside the public listing text', () => {
  assert.equal(validate({...base,description:base.description+' Телефон +359 888 123 456.'})?.field,'nf-description');
  assert.equal(validate({...base,title:'Пиши на owner@example.invalid'})?.field,'nf-description');
});
test('publication needs a cover photo and never accepts more than fifteen', () => {
  assert.equal(validate(base,2,0)?.field,'nf-photos');
  assert.equal(validate(base,2,15),null);
  assert.equal(validate(base,2,16)?.field,'nf-photos');
});
test('input mapping preserves ground floor and no deposit, versus unspecified values', () => {
  const input=toListingInput(base);
  assert.equal(input.floor,0); assert.equal(input.deposit,0); assert.equal(input.priceEur,450.5);
  assert.equal(input.neighborhoodId,null); assert.deepEqual(input.nearbyUniversityIds,[]);
  const omitted=toListingInput({...base,floor:'',deposit:'',totalFloors:''});
  assert.equal(omitted.floor,null); assert.equal(omitted.deposit,null); assert.equal(omitted.totalFloors,null);
});
test('catalog requests share one pending request across pages', async () => {
  let calls=0; let complete;
  const load=()=>{ calls++; return new Promise(resolve=>{complete=resolve;}); };
  const a=referenceCache('test:parallel',load); const b=referenceCache('test:parallel',load);
  assert.equal(calls,1); assert.equal(a,b);
  complete(['sofia']); assert.deepEqual(await a,['sofia']);
  assert.deepEqual(await referenceCache('test:parallel',load),['sofia']); assert.equal(calls,1);
});
test('a failed catalog request can be retried instead of caching an error', async () => {
  let calls=0;
  const load=async()=>{calls++; if(calls===1) throw new Error('offline'); return ['varna'];};
  await assert.rejects(referenceCache('test:retry',load),/offline/);
  assert.deepEqual(await referenceCache('test:retry',load),['varna']); assert.equal(calls,2);
});
test('lastmod uses the actual UTC day when a Git commit crosses local midnight',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'kvartiri-lastmod-')),previous=process.cwd();
  try{
    execFileSync('git',['init','-q',directory]);
    await writeFile(join(directory,'content.txt'),'Transactional date fixture');
    execFileSync('git',['-C',directory,'add','content.txt']);
    execFileSync('git',['-C',directory,'-c','user.name=Date fixture','-c','user.email=date@example.invalid','commit','-qm','Fixture near local midnight'],{env:{...process.env,GIT_AUTHOR_DATE:'2026-10-03T00:10:00+02:00',GIT_COMMITTER_DATE:'2026-10-03T00:10:00+02:00'}});
    process.chdir(directory);
    assert.equal(await sourceModificationDate(['content.txt']),'2026-10-02');
  }finally{process.chdir(previous);await rm(directory,{recursive:true,force:true});}
});
