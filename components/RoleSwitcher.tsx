import React from 'react';
import { Role } from '../types/dqs';

interface Props {
  role: Role;
  onChange: (r: Role) => void;
}

/**
 * RoleSwitcher: Simulate role-based access in UI.
 * Allows switching between Admin, Analyst, and Auditor views.
 */
export const RoleSwitcher: React.FC<Props> = ({ role, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium" style={{ color: '#475569' }}>
        View as:
      </label>
      <select
        value={role}
        onChange={(e) => onChange(e.target.value as Role)}
        className="rounded-lg border px-3 py-1.5 text-sm font-medium"
        style={{ borderColor: '#cbd5e1', color: '#1e293b' }}
      >
        <option value="admin">👑 Admin</option>
        <option value="analyst">📊 Analyst</option>
        <option value="auditor">🔍 Auditor</option>
      </select>
    </div>
  );
};

export default RoleSwitcher;
