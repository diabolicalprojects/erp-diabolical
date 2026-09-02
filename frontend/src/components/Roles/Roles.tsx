import React, { useEffect, useState } from 'react';
import { Shield, UserCheck, Lock, AlertCircle } from 'lucide-react';
import { rolesAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';
import ModuleTutorial from '../Common/ModuleTutorial';
import { PageHeader, Badge, EmptyState } from '../ui';
import Spinner from '../ui/Spinner';

/**
 * Roles y permisos.
 *
 * Este módulo era una maqueta: mantenía su propia copia de la tabla de permisos
 * (que ya vivía en el backend y podía divergir), y al pulsar una tarjeta de rol
 * llamaba a `setUserRole`, que en el contexto era `() => {}` — no ocurría nada.
 * Nunca tocó `rolesAPI`, que sí existía.
 *
 * Ahora lee roles, permisos y usuarios de `GET /api/roles` y asigna el rol real
 * con `PUT /api/roles/:id`.
 */

const ROLE_META: Record<string, { name: string; desc: string }> = {
  admin: {
    name: 'Administrador',
    desc: 'Acceso total a todos los módulos y a la configuración global.'
  },
  vendedor: {
    name: 'Vendedor',
    desc: 'Pipeline, Clientes y Cotizaciones. Sin acceso a Finanzas ni Inventario.'
  },
  almacen: {
    name: 'Almacén',
    desc: 'Inventario y Compras: recepción de mercancía y catálogo.'
  },
  finanzas: {
    name: 'Finanzas',
    desc: 'CxC, CxP, Métricas y reportes de rentabilidad.'
  }
};

const TUTORIAL_STEPS = [
  'Selecciona un rol para ver los módulos que habilita.',
  'Cambia el rol de un usuario desde la lista de la derecha.',
  'Los permisos los aplica el backend: cambiarlos aquí surte efecto de inmediato.',
  'Un administrador no puede quitarse el rol si es el único que queda.'
];

const Roles = () => {
  const { user: currentUser } = useApp();

  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    rolesAPI.get()
      .then(({ data }) => {
        if (cancelled) return;
        setRoles(data.roles || []);
        setPermissions(data.permissions || {});
        setUsers(data.users || []);
        setSelectedRole(data.roles?.[0] ?? null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.error || 'No se pudieron cargar los roles');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Evita actualizar estado si el módulo se desmonta antes de que llegue la
    // respuesta — provocaba una advertencia de React al navegar rápido.
    return () => { cancelled = true; };
  }, []);

  const changeUserRole = async (userId: string, role: string) => {
    setSavingId(userId);
    setError(null);
    try {
      const { data } = await rolesAPI.updateRole(userId, role);
      setUsers((prev) => prev.map((u) => (u._id === userId ? data : u)));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo cambiar el rol');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="animate-fade">
      <PageHeader
        title="Roles y permisos"
        subtitle="Gestión de acceso por perfil de usuario"
        aside={
          <ModuleTutorial
            title="Roles"
            description="Configura la seguridad y visibilidad de los módulos del ERP."
            steps={TUTORIAL_STEPS}
          />
        }
      />

      {error && (
        <div className="alert alert--danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="roles-grid">
        {/* ── Catálogo de roles ────────────────────────────────────────────── */}
        <div className="stack">
          {roles.map((roleId) => {
            const meta = ROLE_META[roleId] ?? { name: roleId, desc: '' };
            const isSelected = selectedRole === roleId;
            return (
              <button
                key={roleId}
                type="button"
                className={`glass-card role-card${isSelected ? ' is-selected' : ''}`}
                onClick={() => setSelectedRole(roleId)}
                aria-pressed={isSelected}
              >
                <div className="tile-head">
                  <h4>{meta.name}</h4>
                  {isSelected && <Shield size={16} />}
                </div>
                <p className="subtitle">{meta.desc}</p>
              </button>
            );
          })}
        </div>

        {/* ── Módulos del rol seleccionado + usuarios ──────────────────────── */}
        <div className="stack">
          <section className="glass-card">
            <h3 className="section-title">
              <Lock size={20} />
              Módulos de {ROLE_META[selectedRole ?? '']?.name ?? '—'}
            </h3>

            <div className="permission-grid">
              {(permissions[selectedRole ?? ''] ?? []).map((moduleName) => (
                <div key={moduleName} className="permission-chip">
                  <UserCheck size={16} />
                  <span>{moduleName}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card">
            <h3 className="section-title">Usuarios</h3>

            {users.length === 0 ? (
              <EmptyState title="Sin usuarios" description="Aún no hay cuentas registradas." />
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>
                          {u.name}
                          {u._id === currentUser?.id && <Badge tone="info">tú</Badge>}
                        </td>
                        <td className="cell-muted">{u.email}</td>
                        <td>
                          <select
                            className="field-input"
                            value={u.role}
                            disabled={savingId === u._id}
                            onChange={(e) => changeUserRole(u._id, e.target.value)}
                          >
                            {roles.map((r) => (
                              <option key={r} value={r}>{ROLE_META[r]?.name ?? r}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Roles;
