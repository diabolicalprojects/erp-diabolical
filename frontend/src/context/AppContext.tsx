import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  customersAPI, dealsAPI, quotesAPI, inventoryAPI,
  purchasesAPI, vendorsAPI, receivablesAPI, payablesAPI,
  projectsAPI, tasksAPI, settingsAPI, authAPI
} from '../services/api';

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [customers, setCustomers] = useState<any[]>([]);
  const [deals, setDeals] = useState<Record<string, any[]>>({
    nuevo: [], contacto: [], propuesta: [], negociacion: [], cierre: []
  });
  const [quotes, setQuotes] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tracking, setTracking] = useState<any[]>([]);
  const [quoteSettings, setQuoteSettings] = useState<any>({});
  const [services, setServices] = useState<any[]>([]);
  const [quotePresets, setQuotePresets] = useState<any[]>([]);

  const customerStatuses = ['activo', 'potencial', 'en_pausa', 'inactivo'];
  const projectStatuses = ['planeacion', 'en_curso', 'retrasado', 'finalizado'];

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('erp_token');
    const savedUser = localStorage.getItem('erp_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  // Load all data when authenticated
  const loadAllData = useCallback(async () => {
    if (!user) return;
    try {
      const [
        custRes, dealRes, quoteRes, invRes,
        purRes, venRes, recRes, payRes,
        projRes, taskRes, settRes
      ] = await Promise.all([
        customersAPI.getAll().catch(() => ({ data: [] })),
        dealsAPI.getAll().catch(() => ({ data: { nuevo: [], contacto: [], propuesta: [], negociacion: [], cierre: [] } })),
        quotesAPI.getAll().catch(() => ({ data: [] })),
        inventoryAPI.getAll().catch(() => ({ data: [] })),
        purchasesAPI.getAll().catch(() => ({ data: [] })),
        vendorsAPI.getAll().catch(() => ({ data: [] })),
        receivablesAPI.getAll().catch(() => ({ data: [] })),
        payablesAPI.getAll().catch(() => ({ data: [] })),
        projectsAPI.getAll().catch(() => ({ data: [] })),
        tasksAPI.getAll().catch(() => ({ data: [] })),
        settingsAPI.getQuote().catch(() => ({ data: {} }))
      ]);

      setCustomers(custRes.data);
      setDeals(dealRes.data);
      setQuotes(quoteRes.data);
      setInventory(invRes.data);
      setPurchases(purRes.data);
      setVendors(venRes.data);
      setReceivables(recRes.data);
      setPayables(payRes.data);
      setProjects(projRes.data);
      setTracking(taskRes.data);
      setQuoteSettings(settRes.data);

      // Services are inventory items of type service
      const svcItems = (invRes.data || []).filter((i: any) => i.type === 'service');
      setServices(svcItems);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }, [user]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Auth
  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    const { token, user: userData } = res.data;
    localStorage.setItem('erp_token', token);
    localStorage.setItem('erp_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    setUser(null);
  };

  // Customer CRUD
  const addCustomer = async (data: any) => {
    const res = await customersAPI.create(data);
    setCustomers([res.data, ...customers]);
    return res.data;
  };
  const updateCustomer = async (id: string, data: any) => {
    const res = await customersAPI.update(id, data);
    setCustomers(customers.map(c => c._id === id ? res.data : c));
    return res.data;
  };
  const deleteCustomer = async (id: string) => {
    await customersAPI.delete(id);
    setCustomers(customers.filter(c => c._id !== id));
  };

  // Deal CRUD
  const addDeal = async (stage: string, deal: any) => {
    const res = await dealsAPI.create({ ...deal, stage });
    setDeals({ ...deals, [stage]: [res.data, ...(deals[stage] || [])] });
    return res.data;
  };
  const deleteDeal = async (stage: string, id: string) => {
    await dealsAPI.delete(id);
    setDeals({ ...deals, [stage]: (deals[stage] || []).filter((d: any) => d._id !== id) });
  };
  const moveDeal = async (dealData: any, fromStage: string, toStage: string) => {
    // Use PATCH /stage — triggers PRD §4A validation + §4B event chain
    const res = await dealsAPI.patchStage(dealData._id, toStage);
    setDeals({
      ...deals,
      [fromStage]: (deals[fromStage] || []).filter((d: any) => d._id !== dealData._id),
      [toStage]: [...(deals[toStage] || []), res.data]
    });
  };

  // Inventory CRUD
  const addInventoryItem = async (data: any) => {
    const res = await inventoryAPI.create(data);
    setInventory([res.data, ...inventory]);
    return res.data;
  };
  const updateInventoryItem = async (id: string, data: any) => {
    const res = await inventoryAPI.update(id, data);
    setInventory(inventory.map(i => i._id === id ? res.data : i));
    return res.data;
  };
  const deleteInventoryItem = async (id: string) => {
    await inventoryAPI.delete(id);
    setInventory(inventory.filter(i => i._id !== id));
  };

  // Quote CRUD
  const addQuote = async (data: any) => {
    const res = await quotesAPI.create(data);
    setQuotes([res.data, ...quotes]);
    return res.data;
  };

  const deleteQuote = async (id: string) => {
    await quotesAPI.delete(id);
    setQuotes(quotes.filter(q => q._id !== id));
  };

  // Purchase actions
  const receiveOrder = async (id: string) => {
    const res = await purchasesAPI.update(id, { status: 'recibido' });
    setPurchases(purchases.map(p => p._id === id ? res.data : p));
  };

  // Receivable payment
  const registerPayment = async (id: string, amount: number) => {
    const res = await receivablesAPI.registerPayment(id, amount);
    setReceivables(receivables.map(r => r._id === id ? res.data : r));
  };

  // Task toggle
  const toggleTracking = async (id: string) => {
    const task = tracking.find((t: any) => t._id === id);
    if (!task) return;
    const newStatus = task.status === 'completado' ? 'pendiente' : 'completado';
    const res = await tasksAPI.update(id, { status: newStatus });
    setTracking(tracking.map((t: any) => t._id === id ? res.data : t));
  };

  // Theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      user, login, logout, loading,
      userRole: user?.role || 'admin', setUserRole: () => {},
      inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
      customers, addCustomer, updateCustomer, deleteCustomer,
      projects, setProjects,
      tracking, toggleTracking,
      quotes, setQuotes, addQuote, deleteQuote,
      deals, setDeals, addDeal, deleteDeal, moveDeal,
      purchases, setPurchases, vendors, setVendors, receiveOrder,
      receivables, setReceivables, registerPayment,
      payables, setPayables,
      customerStatuses, projectStatuses,
      quoteSettings, setQuoteSettings,
      services, setServices,
      quotePresets, setQuotePresets,
      refreshData: loadAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
