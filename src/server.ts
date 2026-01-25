import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { AdminRoute } from '@routes/admin.route';
import { ValidateEnv } from '@utils/validateEnv';
import { FabricRoute } from '@routes/fabric.route';
import { SuperAdminRoute } from './routes/superAdmin.route';
import { DoctorsRoute } from './routes/doctors.route';
import { ClinicRoute } from './routes/clinic.route';
ValidateEnv();

const app = new App(
    [
        new AuthRoute(), new FabricRoute(), new AdminRoute(),
        new SuperAdminRoute(), new DoctorsRoute(), new ClinicRoute()
    ]);

app.listen();
