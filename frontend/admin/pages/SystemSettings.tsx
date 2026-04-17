import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Save, RotateCcw, Check } from "lucide-react";
import { getAllSettings, updateSetting, resetDefaults } from "../services/settingsService";

export default function SystemSettings() {
    const [settings, setSettings] = useState<any[]>([]);
    const [editValues, setEditValues] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);

    const fetchSettings = async () => {
        try {
            const data = await getAllSettings();
            const arr = Array.isArray(data) ? data : [];
            setSettings(arr);
            const vals: Record<string, string> = {};
            arr.forEach((s: any) => { vals[s.key] = s.value; });
            setEditValues(vals);
        } catch { setSettings([]); }
    };

    useEffect(() => { fetchSettings(); }, []);

    const handleSave = async (key: string) => {
        setSaving(key);
        await updateSetting(key, editValues[key]);
        setSaving(null);
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
    };

    const handleReset = async () => {
        if (!confirm("Reset all settings to defaults?")) return;
        await resetDefaults();
        fetchSettings();
    };

    const categories = [...new Set(settings.map((s: any) => s.category))];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">System Settings</h1>
                <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm hover:bg-white/10">
                    <RotateCcw size={16} /> Reset Defaults
                </button>
            </div>

            {categories.map((cat) => (
                <motion.div key={cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-xl">
                    <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
                        <Settings size={16} className="text-blue-400" />
                        <h2 className="text-white font-semibold text-sm">{cat}</h2>
                    </div>
                    <div className="divide-y divide-white/5">
                        {settings.filter((s: any) => s.category === cat).map((s: any) => (
                            <div key={s.key} className="px-5 py-4 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium">{s.key}</p>
                                    {s.description && <p className="text-gray-500 text-xs">{s.description}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    {s.type === "boolean" ? (
                                        <button onClick={() => setEditValues({ ...editValues, [s.key]: editValues[s.key] === "true" ? "false" : "true" })} className={`px-3 py-1 rounded-full text-xs font-medium ${editValues[s.key] === "true" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                            {editValues[s.key] === "true" ? "Enabled" : "Disabled"}
                                        </button>
                                    ) : (
                                        <input type={s.type === "number" ? "number" : "text"} value={editValues[s.key] || ""} onChange={(e) => setEditValues({ ...editValues, [s.key]: e.target.value })} className="w-40 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                                    )}
                                    <button onClick={() => handleSave(s.key)} disabled={editValues[s.key] === s.value} className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-30">
                                        {saving === s.key ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved === s.key ? <Check size={14} /> : <Save size={14} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            ))}

            {settings.length === 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                    <Settings className="mx-auto mb-3 text-gray-600" size={32} />
                    <p className="text-gray-400">No settings yet. Click "Reset Defaults" to seed.</p>
                </div>
            )}
        </div>
    );
}
