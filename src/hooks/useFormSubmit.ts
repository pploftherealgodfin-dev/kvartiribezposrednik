import { useCallback, useState } from 'react';

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

  const submit = useCallback(
    async (form: HTMLFormElement) => {
      // 1) Четем директно от DOM (хваща и стойности от autofill).
      const data = new FormData(form);
      const honeypot = String(data.get(honeypotField) ?? '').trim();

      // 2) Honeypot попълнен → не изпращаме нищо, показваме общ успех.
      if (honeypot) {
        setStatus('success');
        form.reset();
        return;
      }
      data.delete(honeypotField);

      setStatus('submitting');
      setError('');

      const body = new URLSearchParams();
      data.forEach((value, key) => {
        if (typeof value === 'string' && value !== '') {
          body.append(key, value);
        }
      });

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });

        const responseText = await response.text();
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

        const serverMsg =
          parsed?.meta?.message || parsed?.message || parsed?.meta?.detail || responseText;
        const isSpam =
          typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('spam');

        if (response.ok && parsed?.code === 'OK' && !isSpam) {
          setStatus('success');
          form.reset();
        } else {
          setStatus('error');
          setError(
            typeof serverMsg === 'string' && serverMsg.trim() ? serverMsg : genericError,
          );
        }
      } catch {
        setStatus('error');
        setError(genericError);
      }
    },
    [endpoint, honeypotField, genericError],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError('');
  }, []);

  return { status, error, submit, reset };
}