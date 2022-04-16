import type { IpcMainInvokeEvent } from 'electron';

import { EncodedError, Response } from 'models/ElectronApi';

type BasicListener = (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown;

type ErrorListener<T = unknown> = (
  event: IpcMainInvokeEvent,
  ...args: unknown[]
) => Promise<Response<T>>;

function encodeError(error: Error): EncodedError {
  const encodedError: EncodedError = {
    name: error.name,
    message: error.message,
    extra: { ...error },
  };
  return encodedError;
}

function decodeError(encodedError: EncodedError): Error {
  const error = new Error(encodedError.message);
  error.name = encodedError.name;
  Object.assign(error, encodedError.extra);
  return error;
}

export function handlerWrapper(listener: BasicListener): ErrorListener {
  return async (...args) => {
    try {
      return { result: await listener(...args) };
    } catch (err) {
      return {
        error: encodeError(err instanceof Error ? err : new Error('Unknown')),
      };
    }
  };
}

export async function invokeWrapper<T>(
  invokeResult: Promise<Response<T>>,
): Promise<T> {
  const result = await invokeResult;

  if ('error' in result) {
    throw decodeError(result.error);
  }

  if ('result' in result) {
    return result.result;
  }

  throw new Error('Bad response');
}
