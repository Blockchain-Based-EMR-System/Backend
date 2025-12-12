import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { AdminRoute } from '@routes/admin.route';
import { ValidateEnv } from '@utils/validateEnv';
import { FabricRoute } from '@routes/fabric.route';
import { SuperAdminRoute } from './routes/superAdmin.route';
ValidateEnv();

const app = new App([new AuthRoute(), new FabricRoute(), new AdminRoute() , new SuperAdminRoute()]);

app.listen();
