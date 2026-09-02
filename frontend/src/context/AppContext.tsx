import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  customersAPI, dealsAPI, quotesAPI, inventoryAPI,
  purchasesAPI, vendorsAPI, receivablesAPI, payablesAPI,
  projectsAPI, tasksAPI, settingsAPI, authAPI
} from '../services/api';
import { CUSTOMER_STATUSES, PROJECT_STATUSES } from '../lib/constants';

const AppContext = createContext<any>(null);

const EMPTY_PIPELINE = { nuevo: [], contacto: [], propuesta: [], negociacion: [], cierre: [] };

/** Referencia estable: un array nuevo en cada render rompería el useMemo del value. */
const EMPTY_PRESETS: any[] = [];

const STORAGE = { token: 'erp_token', user: 'erp_user', theme: 'erp_theme' };

/** Módulos que el backend restringe por rol (PRD §5). No se piden si el rol no aplica. */
const FINANCE_ROLES = ['admin', 'finanzas'];

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // El tema se lee de localStorage en el inicializador, no en un efecto: así no
  // hay parpadeo de oscuro a claro en el primer render. Antes ni se guardaba,
  // y volvía a "dark" en cada recarga.
  const [theme, setTheme] = useState<string>(
    () => localStorage.getItem(STORAGE.theme) || 'dark'
  );

  const [user, setUser] = useState<any>(() => {
    const raw = localStorage.getItem(STORAGE.user);
    if (!raw || !localStorage.getItem(STORAGE.token)) return null;
    try {
      return JSON.parse(raw);
    } catch {
      // Un valor corrupto dejaba la app atascada en la pantalla de carga.
      localStorage.removeItem(STORAGE.user);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [deals, setDeals] = useState<Record<string, any[]>>(EMPTY_PIPELINE);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tracking, setTracking] = useState<any[]>([]);
  const [quoteSettings, setQuoteSettings] = useState<any>({});

  // ─── TEMA ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE.theme, theme);
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    []
  );

  // ─── CARGA DE DATOS ─────────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const canSeeFinance = FINANCE_ROLES.includes(user.role);
    const empty = { data: [] };
    // Un catch por endpoint: un 403 en un módulo restringido no debe dejar al
    // resto de la app sin datos.
    const safe = (p: Promise<any>, fallback: any = empty) => p.catch(() => fallback);

    try {
      const [
        cust, deal, quote, inv, pur, ven, rec, pay, proj, task, sett
      ] = await Promise.all([
        safe(customersAPI.getAll()),
        safe(dealsAPI.getAll(), { data: EMPTY_PIPELINE }),
        safe(quotesAPI.getAll()),
        safe(inventoryAPI.getAll()),
        safe(purchasesAPI.getAll()),
        safe(vendorsAPI.getAll()),
        canSeeFinance ? safe(receivablesAPI.getAll()) : empty,
        canSeeFinance ? safe(payablesAPI.getAll()) : empty,
        safe(projectsAPI.getAll()),
        safe(tasksAPI.getAll()),
        safe(settingsAPI.getQuote(), { data: {} })
      ]);

      setCustomers(cust.data);
      setDeals(deal.data || EMPTY_PIPELINE);
      setQuotes(quote.data);
      setInventory(inv.data);
      setPurchases(pur.data);
      setVendors(ven.data);
      setReceivables(rec.data);
      setPayables(pay.data);
      setProjects(proj.data);
      setTracking(task.data);
      setQuoteSettings(sett.data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  /** Ítems de inventario marcados como servicio. Derivado, no un estado aparte. */
  const services = useMemo(
    () => inventory.filter((i: any) => i.type === 'service'),
    [inventory]
  );

  // ─── AUTENTICACIÓN ──────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authAPI.login(email, password);
    localStorage.setItem(STORAGE.token, data.token);
    localStorage.setItem(STORAGE.user, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE.token);
    localStorage.removeItem(STORAGE.user);
    setUser(null);
    // Se limpian los datos: sin esto, el siguiente usuario veía por un instante
    // la información del anterior.
    setCustomers([]); setDeals(EMPTY_PIPELINE); setQuotes([]); setInventory([]);
    setPurchases([]); setVendors([]); setReceivables([]); setPayables([]);
    setProjects([]); setTracking([]); setQuoteSettings({});
  }, []);

  /**
   * Fábrica de operaciones CRUD sobre una lista.
   *
   * Todas las actualizaciones usan la forma funcional de setState. Antes se
   * hacía setCustomers([nuevo, ...customers]), leyendo la lista del closure:
   * dos altas seguidas antes de re-renderizar perdían la primera.
   */
  const makeCrud = (
    api: { create: any; update: any; delete: any },
    setList: React.Dispatch<React.SetStateAction<any[]>>
  ) => ({
    add: async (data: any) => {
      const { data: created } = await api.create(data);
      setList((prev) => [created, ...prev]);
      return created;
    },
    update: async (id: string, data: any) => {
      const { data: updated } = await api.update(id, data);
      setList((prev) => prev.map((item) => (item._id === id ? updated : item)));
      return updated;
    },
    remove: async (id: string) => {
      await api.delete(id);
      setList((prev) => prev.filter((item) => item._id !== id));
    }
  });

  const customerCrud  = useMemo(() => makeCrud(customersAPI, setCustomers), []);
  const inventoryCrud = useMemo(() => makeCrud(inventoryAPI, setInventory), []);

  // ─── COTIZACIONES ───────────────────────────────────────────────────────────
  const addQuote = useCallback(async (data: any) => {
    const { data: quote } = await quotesAPI.create(data);
    setQuotes((prev) => [quote, ...prev]);

    // El backend pudo crear un Deal automáticamente (PRD §3); se recarga el
    // pipeline para que la tarjeta aparezca sin navegar.
    try {
      const { data: pipeline } = await dealsAPI.getAll();
      setDeals(pipeline);
    } catch {
      /* No crítico: el pipeline se actualiza al entrar al módulo. */
    }

    return quote;
  }, []);

  const updateQuote = useCallback(async (id: string, data: any) => {
    const { data: quote } = await quotesAPI.update(id, data);
    setQuotes((prev) => prev.map((q) => (q._id === id ? quote : q)));
    return quote;
  }, []);

  const deleteQuote = useCallback(async (id: string) => {
    await quotesAPI.delete(id);
    setQuotes((prev) => prev.filter((q) => q._id !== id));
  }, []);

  // ─── TRATOS ─────────────────────────────────────────────────────────────────
  const addDeal = useCallback(async (stage: string, deal: any) => {
    const { data: created } = await dealsAPI.create({ ...deal, stage });
    setDeals((prev) => ({ ...prev, [stage]: [created, ...(prev[stage] || [])] }));
    return created;
  }, []);

  const deleteDeal = useCallback(async (stage: string, id: string) => {
    await dealsAPI.delete(id);
    setDeals((prev) => ({ ...prev, [stage]: (prev[stage] || []).filter((d: any) => d._id !== id) }));
  }, []);

  /**
   * Mueve un trato de etapa vía PATCH (dispara validación y evento de cierre).
   * Relanza el error para que Pipeline muestre el motivo del rechazo.
   */
  const moveDeal = useCallback(async (deal: any, fromStage: string, toStage: string) => {
    const { data: updated } = await dealsAPI.patchStage(deal._id, toStage);
    setDeals((prev) => ({
      ...prev,
      [fromStage]: (prev[fromStage] || []).filter((d: any) => d._id !== deal._id),
      [toStage]: [updated, ...(prev[toStage] || [])]
    }));
    return updated;
  }, []);

  // ─── OTRAS ACCIONES ─────────────────────────────────────────────────────────
  const receiveOrder = useCallback(async (id: string) => {
    const { data } = await purchasesAPI.update(id, { status: 'recibido' });
    setPurchases((prev) => prev.map((p) => (p._id === id ? data : p)));
  }, []);

  const registerPayment = useCallback(async (id: string, amount: number) => {
    const { data } = await receivablesAPI.registerPayment(id, amount);
    setReceivables((prev) => prev.map((r) => (r._id === id ? data : r)));
  }, []);

  const toggleTracking = useCallback(async (id: string) => {
    // Se lee de prev en vez del closure para no invertir un estado obsoleto.
    let next: string | null = null;
    setTracking((prev) => {
      const task = prev.find((t: any) => t._id === id);
      if (task) next = task.status === 'completado' ? 'pendiente' : 'completado';
      return prev;
    });
    if (!next) return;

    const { data } = await tasksAPI.update(id, { status: next });
    setTracking((prev) => prev.map((t: any) => (t._id === id ? data : t)));
  }, []);

  // useMemo sobre el value: sin él se creaba un objeto nuevo en cada render y
  // los ~20 consumidores del contexto se re-renderizaban aunque nada cambiara.
  const value = useMemo(() => ({
    theme, toggleTheme,
    user, login, logout, loading,
    // El rol real. Antes era `user?.role || 'admin'`, que daba permisos de
    // admin en la interfaz a cualquier sesión sin usuario cargado.
    userRole: user?.role ?? null,

    customers,
    addCustomer: customerCrud.add,
    updateCustomer: customerCrud.update,
    deleteCustomer: customerCrud.remove,

    inventory,
    addInventoryItem: inventoryCrud.add,
    updateInventoryItem: inventoryCrud.update,
    deleteInventoryItem: inventoryCrud.remove,

    quotes, setQuotes, addQuote, updateQuote, deleteQuote,
    deals, setDeals, addDeal, deleteDeal, moveDeal,

    purchases, setPurchases, vendors, setVendors, receiveOrder,
    receivables, setReceivables, registerPayment,
    payables, setPayables,
    projects, setProjects,
    tracking, toggleTracking,

    quoteSettings, setQuoteSettings,
    services,

    // Constantes de dominio. Se siguen exponiendo por el contexto porque varios
    // módulos las consumen desde aquí; la fuente real es lib/constants.ts.
    customerStatuses: CUSTOMER_STATUSES,
    projectStatuses: PROJECT_STATUSES,
    // QuoteWizard itera esta lista en su pestaña "presets". Nunca se ha llegado
    // a llenar, pero quitarla del contexto hacía que `.map` reventara.
    quotePresets: EMPTY_PRESETS,

    refreshData: loadAllData
  }), [
    theme, toggleTheme, user, login, logout, loading,
    customers, customerCrud, inventory, inventoryCrud,
    quotes, addQuote, updateQuote, deleteQuote,
    deals, addDeal, deleteDeal, moveDeal,
    purchases, vendors, receiveOrder,
    receivables, registerPayment, payables,
    projects, tracking, toggleTracking,
    quoteSettings, services, loadAllData
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  // Antes devolvía null y el componente reventaba con "cannot destructure",
  // sin pista de que faltaba el provider.
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
};
