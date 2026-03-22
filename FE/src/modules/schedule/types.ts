// ─── Enums ────────────────────────────────────────────────────────────────────

export type ScheduleStatus = 'draft' | 'submitted' | 'approved';
export type ScheduleType   = 'duty' | 'weekly_work';
export type ShiftType      = 'morning' | 'afternoon' | 'night';

// ─── Domain models ────────────────────────────────────────────────────────────

export interface Schedule {
  schedule_id:             number;
  schedule_type:           ScheduleType;
  week:                    number;
  year:                    number;
  status:                  ScheduleStatus;
  description?:            string;
  source_department_id:    number;
  source_department_name?: string;
  owner_department_id:     number;
  owner_department_name?:  string;
  created_by:              number;
  created_at:              string;
  updated_at:              string;
  /** Present only when the detail endpoint is called */
  shifts?:                 Shift[];
}

export interface Shift {
  shift_id:      number;
  schedule_id:   number;
  department_id: number;
  shift_date:    string;         // YYYY-MM-DD
  shift_type:    ShiftType;
  start_time:    string;         // HH:MM:SS
  end_time:      string;
  max_staff:     number;
  notes?:        string;
  assignments?:  ShiftAssignment[];
}

export interface ShiftAssignment {
  assignment_id:  number;
  shift_id:       number;
  user_id:        number;
  full_name?:     string;
  employee_code?: string;
  note?:          string;
  assigned_at:    string;
}

export interface WeeklyWorkItem {
  weekly_work_item_id: number;
  schedule_id:         number;
  work_date:           string;   // YYYY-MM-DD
  time_period?:        string;
  content:             string;
  location?:           string;
  participantIds?:     number[];
  participantNames?:   string | null;
  created_at:          string;
  updated_at:          string;
}
