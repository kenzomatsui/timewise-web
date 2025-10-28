-- Users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- User profiles table
CREATE TABLE user_profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  occupation TEXT,
  sleep_hours TEXT NOT NULL DEFAULT '22:00 - 06:00',
  productive_hours TEXT[] NOT NULL DEFAULT '{"morning"}',
  custom_hours TEXT,
  focus_preference TEXT NOT NULL DEFAULT 'balance',
  alert_frequency TEXT NOT NULL DEFAULT 'normal',
  allocation_strategy TEXT NOT NULL DEFAULT 'fill_first_day',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  estimated_time INTEGER NOT NULL,
  deadline TIMESTAMPTZ,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  kanban_status TEXT NOT NULL DEFAULT 'todo',
  postponements INTEGER NOT NULL DEFAULT 0,
  allocated_date DATE,
  allocated_start_time TIME,
  allocated_end_time TIME,
  manual_allocation BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_allocated_date ON tasks(allocated_date);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);

-- Appointments table
CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  category TEXT NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'none',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(date);
