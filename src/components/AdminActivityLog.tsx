import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  adminEmail: string;
  actionType: string;
  collectionName: string;
  details: string;
  timestamp: any;
}

export default function AdminActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'admin_activity_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: ActivityLog[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      setLogs(data);
      setLoading(false);
    }, (error: any) => {
      if (error.code !== 'permission-denied') {
        console.error(error);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getActionColor = (type: string) => {
    switch (type) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-rose-100 text-rose-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-indigo-600" />
            Activity Log
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Recent administrative changes to content.
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center flex-col items-center py-20 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No activity logged yet.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-100">
            {logs.map((log) => (
              <li key={log.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-x-6">
                  <div className="flex min-w-0 gap-x-4">
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm font-semibold leading-6 text-gray-900">
                        {log.details}
                      </p>
                      <p className="mt-1 flex text-xs leading-5 text-gray-500">
                        <span className="truncate">{log.adminEmail}</span>
                        <span className="mx-2">•</span>
                        <span>{log.collectionName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0 sm:flex-row sm:items-center">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getActionColor(log.actionType)}`}>
                      {log.actionType}
                    </span>
                    {log.timestamp && (
                      <p className="text-xs leading-5 text-gray-500 whitespace-nowrap">
                        {format(log.timestamp.toDate(), "PP p", { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
