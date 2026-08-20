import React, { useEffect, useState } from 'react';
import { Mail, Trash2, CheckCircle2, Clock, Eye, MessageSquare, Search, Filter } from 'lucide-react';

export default function AdminContactMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/contact-messages');
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/contact-messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        loadMessages();
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage((prev: any) => ({ ...prev, status }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact message?')) return;
    try {
      const res = await fetch(`/api/contact-messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadMessages();
        if (selectedMessage?.id === id) setSelectedMessage(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (
      (msg.name && msg.name.toLowerCase().includes(q)) ||
      (msg.email && msg.email.toLowerCase().includes(q)) ||
      (msg.subject && msg.subject.toLowerCase().includes(q)) ||
      (msg.message && msg.message.toLowerCase().includes(q))
    );
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Customer Contact Messages</h1>
          <p className="text-xs text-slate-400 mt-1">Manage inquiries submitted through the public Contact Us form</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Messages List Table */}
        <div className={`lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden ${selectedMessage ? 'hidden lg:block' : ''}`}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                <th className="p-4">Customer</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500">Loading messages...</td></tr>
              ) : filteredMessages.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500">No contact messages found.</td></tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (msg.status === 'unread') handleUpdateStatus(msg.id, 'read');
                    }}
                    className={`hover:bg-slate-800/50 cursor-pointer transition ${selectedMessage?.id === msg.id ? 'bg-slate-800/80' : ''}`}
                  >
                    <td className="p-4">
                      <div className="font-bold text-white">{msg.name}</div>
                      <div className="text-[11px] text-slate-400">{msg.email}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-200 truncate max-w-[180px]">
                      {msg.subject}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        msg.status === 'unread' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        msg.status === 'read' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        msg.status === 'replied' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {new Date(msg.created_at || msg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedMessage(msg)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                          title="View Message"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Message Details Drawer / Panel */}
        <div className={`lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 ${!selectedMessage ? 'hidden lg:flex lg:items-center lg:justify-center text-slate-500 text-xs' : 'space-y-6'}`}>
          {!selectedMessage ? (
            <div className="text-center space-y-2 py-12">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <p>Select a message from the list to view full details and manage status.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedMessage.subject}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Received on {new Date(selectedMessage.created_at || selectedMessage.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="lg:hidden text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Customer Name</span>
                  <span className="text-white font-bold">{selectedMessage.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Email Address</span>
                  <a href={`mailto:${selectedMessage.email}`} className="text-emerald-400 hover:underline">{selectedMessage.email}</a>
                </div>
                {selectedMessage.phone && (
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Phone Number</span>
                    <a href={`tel:${selectedMessage.phone}`} className="text-emerald-400 hover:underline">{selectedMessage.phone}</a>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Message Content</span>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Update Status</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['unread', 'read', 'replied', 'closed'].map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedMessage.id, st)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition ${
                        selectedMessage.status === st ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
