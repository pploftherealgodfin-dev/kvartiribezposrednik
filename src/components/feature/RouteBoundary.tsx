import { Component, type ReactNode } from 'react';
import SiteLayout from './SiteLayout';
export default class RouteBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<SiteLayout><div role="alert" className="mx-auto max-w-lg px-4 py-16"><h1 className="text-2xl font-semibold">Страницата не се зареди</h1><p className="mt-3 text-sm text-foreground-600">Провери връзката. Възможно е сайтът да е обновен, докато го разглеждаш.</p><button className="ui-button mt-5" onClick={()=>window.location.reload()}>Зареди отново</button></div></SiteLayout>:this.props.children;}
}
