import { useState } from 'react';
import { Search } from 'lucide-react';

export default function EmployeeCardsTab({ employees, config }: { employees: any[], config?: any }) {
  const [search, setSearch] = useState('');

  const filteredEmployees = employees?.filter(emp => 
    emp?.name?.toLowerCase().includes(search.toLowerCase()) || 
    emp?.code?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Employees List</h2>
        <div className="relative w-64">
          <input 
            type="text" 
            placeholder="Search by name or code..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((emp, i) => (
           <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600">
                {emp.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{emp.name}</h3>
                <p className="text-sm text-slate-500">{emp.code} • {emp.dept}</p>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
}
