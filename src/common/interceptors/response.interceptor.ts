import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response: any) => {
        // If response is already { data, message }, just add status
        if (response && 'data' in response && 'message' in response) {
          return { status: 'success', ...response };
        }

        // For other raw responses
        if (response !== undefined && response !== null) {
          return { status: 'success', data: response, message: null };
        }

        // Default fallback
        return { status: 'success', data: null, message: null };
      }),
    );
  }
}
