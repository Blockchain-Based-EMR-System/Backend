import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { ValidateEnv } from '@utils/validateEnv';
import { FabricRoute } from '@routes/fabric.route';
ValidateEnv();

const app = new App([new AuthRoute(), new FabricRoute()]);

app.listen();
