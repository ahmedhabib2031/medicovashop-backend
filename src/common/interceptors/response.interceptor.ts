import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  status: string;
  data: T;
  message?: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseFormat<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    return next.handle().pipe(
      map((data: any) => {
        // If the controller returns an object with data + message, use it
        if (data && data.data !== undefined && data.message !== undefined) {
          return {
            status: 'success',
            data: data.data,
            message: data.message,
          };
        }

        return {
          status: 'success',
          data,
          message: null,
        };
      }),
    );
  }
}
