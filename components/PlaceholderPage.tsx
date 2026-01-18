export default function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🚧
            </div>
            <h2 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">{title}</h2>
            <p className="text-slate-500 text-sm">This feature is being migrated. Check back soon!</p>
        </div>
    );
}
