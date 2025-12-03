import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class TranslationInterceptor implements NestInterceptor {
  constructor(private readonly i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const defaultLang = req.headers['x-lang'] || 'en';

    return next.handle().pipe(
      map(async (data) => {
        if (data?.message) {
          const lang = data.language || req.user?.language || defaultLang;

          // Use i18n.t() instead of translate
          const translated = await this.i18n.t(data.message, { lang });

          return { ...data, message: translated };
        }
        return data;
      }),
    );
  }
}
