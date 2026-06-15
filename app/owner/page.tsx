'use client';
/* eslint-disable react-hooks/immutability */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Settings, Copy, CheckCircle2 } from 'lucide-react';

export default function OwnerPanel() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [showOrgForm, setShowOrgForm] = useState(false);
  
  const [orgForm, setOrgForm] = useState({
    slug: '',
    name: '',
    admin_password: '',
    attendance_methods: { face: true, qr: true, nfc: true, gps: true, manual: true }
  });

  useEffect(() => {
    if (auth) {
      loadOrgs();
    }
  }, [auth]);

  const loadOrgs = () => {
    let orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
    if (orgs.length === 0) {
      orgs = [{
        slug: 'default',
        name: 'Default Org',
        admin_password: 'admin',
        attendance_methods: { face: true, qr: true, nfc: true, gps: true, manual: true }
      }];
      localStorage.setItem('organizations', JSON.stringify(orgs));
    }
    setOrganizations(orgs);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_OWNER_PASSWORD || password === 'owner') {
      setAuth(true);
    } else {
      alert('Password incorrect');
    }
  };

  const saveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = organizations.findIndex(o => o.slug === orgForm.slug);
    let updated;
    if (existing >= 0) {
      updated = [...organizations];
      updated[existing] = { ...updated[existing], ...orgForm };
    } else {
      updated = [...organizations, orgForm];
    }
    setOrganizations(updated);
    localStorage.setItem('organizations', JSON.stringify(updated));
    setShowOrgForm(false);
    setOrgForm({
      slug: '',
      name: '',
      admin_password: '',
      attendance_methods: { face: true, qr: true, nfc: true, gps: true, manual: true }
    });
  };

  const deleteOrg = (slug: string) => {
    if (confirm('Are you sure you want to delete this organization?')) {
       const updated = organizations.filter(o => o.slug !== slug);
       setOrganizations(updated);
       localStorage.setItem('organizations', JSON.stringify(updated));
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl max-w-sm w-full">
          <h2 className="text-2xl font-bold mb-4">Owner Panel Login</h2>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded mb-4" 
            placeholder="Owner Password" 
          />
          <button className="w-full bg-slate-900 text-white font-bold py-2 rounded">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building /> Organizations (Multi-Tenant)</h1>
          <button onClick={() => setShowOrgForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold">Add Org</button>
        </header>

        {showOrgForm && (
          <form onSubmit={saveOrg} className="bg-white p-6 rounded-xl border border-slate-200 mb-8 max-w-2xl">
            <h2 className="text-lg font-bold mb-4">{orgForm.slug ? 'Edit' : 'Create'} Organization</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold mb-1">Slug (e.g. comp-a)</label>
                <input required value={orgForm.slug} onChange={e=>setOrgForm({...orgForm, slug: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Name</label>
                <input required value={orgForm.name} onChange={e=>setOrgForm({...orgForm, name: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold mb-1">Admin Password</label>
                <input required type="text" value={orgForm.admin_password} onChange={e=>setOrgForm({...orgForm, admin_password: e.target.value})} className="w-full border p-2 rounded" />
              </div>
            </div>
            
            <div className="mb-4">
               <label className="block text-xs font-bold mb-2">Enabled Attendance Methods</label>
               <div className="flex gap-4 p-4 border rounded bg-slate-50">
                 {['face', 'qr', 'nfc', 'gps', 'manual'].map(m => (
                   <label key={m} className="flex items-center gap-2">
                     <input type="checkbox" checked={orgForm.attendance_methods[m as keyof typeof orgForm.attendance_methods]} onChange={e => setOrgForm({...orgForm, attendance_methods: {...orgForm.attendance_methods, [m]: e.target.checked}})} />
                     <span className="capitalize">{m}</span>
                   </label>
                 ))}
               </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">Save</button>
              <button type="button" onClick={() => setShowOrgForm(false)} className="bg-slate-200 px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map(org => (
            <div key={org.slug} className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-bold text-xl mb-1">{org.name}</h3>
              <p className="text-slate-500 text-sm mb-4">Slug: {org.slug}</p>
              
              <div className="space-y-2 mb-6">
                <button 
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?org=${org.slug}`); alert('Copied employee app link'); }}
                  className="w-full text-left text-sm py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded flex justify-between items-center"
                >
                  App Link <Copy size={14} />
                </button>
                <button 
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/admin?org=${org.slug}`); alert('Copied admin link'); }}
                  className="w-full text-left text-sm py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded flex justify-between items-center"
                >
                  Admin Link <Copy size={14} />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">PWD: {org.admin_password}</span>
                <div className="flex gap-2">
                   <button onClick={() => { setOrgForm(org); setShowOrgForm(true); }} className="text-indigo-600 font-bold text-sm">Edit</button>
                   <button onClick={() => deleteOrg(org.slug)} className="text-rose-600 font-bold text-sm">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
