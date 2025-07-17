import { type Controller } from '@/interfaces/controllers';
import { type Tokens } from '@/interfaces/tokens';

declare namespace authControllerType {
  type register = Controller.methodsHandler<{
    body: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      phone?: string;
    };
  }>;

  type login = Controller.methodsHandler<{
    body: {
      email: string;
      password: string;
    };
  }>;

  type resetPassword = Controller.methodsHandler<{
    cookie: { reset_access: Tokens.Cookie.Identifier };
    body: {
      password: string;
    };
    token: string;
  }>;

  type askResetPassword = Controller.methodsHandler<{
    params: { email: string };
  }>;

  type validAccount = Controller.methodsHandler<{
    token: string;
    body: { access_code: number };
  }>;

  type oAuth = Controller.methodsHandler<{
    query: {
      email: string;
      firstName: string;
      lastName: string;
    };
  }>;
}
