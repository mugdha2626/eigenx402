export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
          <span className="text-xl font-bold">EigenX402</span>
        </div>
        <nav className="flex items-center space-x-6">
          <a href="#" className="text-gray-600 hover:text-gray-900">Docs</a>
          <a href="#" className="text-gray-600 hover:text-gray-900">GitHub</a>
        </nav>
      </div>
    </header>
  );
}
