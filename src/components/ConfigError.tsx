export default function ConfigError() {
  return (
    <div className="min-h-screen bg-k-background flex items-center justify-center p-6">
      <div className="max-w-mobile w-full bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-xl font-bold text-red-600 mb-3">
          Configuration manquante
        </h1>
        <p className="text-sm text-gray-800 mb-3">
          L'application ne peut pas démarrer parce que les variables d'environnement Supabase ne sont pas définies&nbsp;:
        </p>
        <ul className="text-sm text-gray-800 list-disc pl-5 mb-4 space-y-1">
          <li><code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_URL</code></li>
          <li><code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
        </ul>
        <p className="text-sm text-gray-800 mb-2 font-semibold">À faire&nbsp;:</p>
        <ol className="text-sm text-gray-800 list-decimal pl-5 space-y-1">
          <li>Vercel → projet kifekoi2 → <strong>Settings → Environment Variables</strong></li>
          <li>Ajouter les deux variables ci-dessus (Production + Preview + Development)</li>
          <li><strong>Deployments</strong> → dernier → <strong>Redeploy</strong> sans cache</li>
        </ol>
      </div>
    </div>
  );
}
