import { DayOfWeek} from "@prisma/client";

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  clinic_id: string | null;
  day_of_week: DayOfWeek;
  start_time: Date;
  end_time: Date;
  slot_duration: number;
  buffer_time: number;
  is_active: boolean;
  created_at: Date;
  modified_at: Date;
  deleted_at: Date | null;
}
