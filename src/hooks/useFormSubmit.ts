import { useCallback, useEffect, useRef, useState } from 'react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

interface UseFormSubmitOptions {
  /** Адресът, върнат от платформата за приемане на формата. */
  endpoint: string;
  /** Име на honeypot полето (скрито, за защита от ботове). */
  honeypotField: string;
  /** Общо съобщение за грешка, ако сървърът не върне по-конкретно. */
  genericError: string;
}

interface UseFormSubmitResult {
  status: FormStatus;
  error: string;
  submit: (form: HTMLFormElement) => Promise<void>;
  reset: () => void;
}

/**
 * Единна логика за изпращане на форми:
 * honeypot защита, четене директно от DOM, разбор на отговора и статус.
 */
export function useFormSubmit({
  endpoint,
  honeypotField,
  genericError,
}: UseFormSubmitOptions): UseFormSubmitResult {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);

  const submit = useCallback(
    async (form: HTMLFormElement) => {
      if (request.current) return;
      // 1) Четем директно от DOM (хваща и стойности от autofill).
      const data = new FormData(form);
      const honeypot = String(data.get(honeypotField) ?? '').trim();

      // 2) Honeypot попълнен → няма изпращане или фалшиво потвърждение.
      if (honeypot) {
        setStatus('error'); setError(genericError);
        return;
      }
      data.delete(honeypotField);
      if (!String(data.get('name') ?? '').trim() || !String(data.get('message') ?? '').trim()) { setStatus('error'); setError('Въведи име и съобщение. Полетата не могат да съдържат само интервали.'); return; }

      setStatus('submitting');
      setError('');

      const body = new URLSearchParams();
      data.forEach((value, key) => {
        if (typeof value === 'string' && value !== '') {
          body.append(key, value.trim());
        }
      });

      const controller = new AbortController();
      request.current = controller;
      const timeout = window.setTimeout(() => controller.abort(), 25000);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
          signal: controller.signal,
        });

        const responseText = await response.text();
        if (request.current !== controller) return;
        let parsed: {
          code?: string;
          message?: string;
          meta?: { message?: string; detail?: string };
        } | null = null;
        try {
          parsed = JSON.parse(responseText);
        } catch {
          parsed = null;
        }

        const serverMsg = parsed?.meta?.message || parsed?.message || parsed?.meta?.detail || '';
        const isSpam =
          typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('spam');

        if (response.ok && parsed?.code === 'OK' && !isSpam) {
          setStatus('success');
          form.reset();
        } else {
          setStatus('error');
          setError(
            genericError,
          );
        }
      } catch {
        if (request.current === controller) { setStatus('error'); setError(genericError); }
      } finally {
        window.clearTimeout(timeout);
        if (request.current === controller) request.current = null;
      }
    },
    [endpoint, honeypotField, genericError],
  );

  const reset = useCallback(() => {
    request.current?.abort(); request.current = null;
    setStatus('idle');
    setError('');
  }, []);

  return { status, error, submit, reset };
}
