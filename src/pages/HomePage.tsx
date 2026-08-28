import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="bg-gray-50 text-gray-800 font-sans antialiased scroll-smooth">
      {/* Notification Bar */}
      <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium">
        🚀 L'API E nova est en ligne — Consultez la nouvelle <Link to="#" className="underline hover:text-amber-500">Documentation API</Link>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              {/* Utilise ici le logo uploadé */}
              <img src="/api/images/a3541b19-7b57-41db-b6dc-8ef440ae09ba" alt="E nova" className="h-10 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.insertAdjacentHTML('afterend', '<span class="font-bold text-xl text-blue-600">E nova</span>'); }} />
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#plans" className="text-gray-600 hover:text-blue-600 transition">Plans</a>
              <a href="#fonctionnalites" className="text-gray-600 hover:text-blue-600 transition">Fonctionnalités</a>
              <a href="#demarrage" className="text-gray-600 hover:text-blue-600 transition">Démarrage</a>
              <a href="#aide" className="text-gray-600 hover:text-blue-600 transition">Aide</a>
            </div>
            <div>
              <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition font-medium">
                Connexion
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            Le moyen le plus rapide de <span className="text-blue-600">vendre en ligne</span> en Algérie
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Support complet en arabe et français, intégrations avec tous les coursiers algériens, et le paiement à la livraison (COD) intégré dès le premier jour.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#plans" className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-800 transition shadow-lg">
              Voir les plans
            </a>
            <Link to="/login" className="bg-gray-100 text-gray-800 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2">
              <i className="fas fa-play-circle text-blue-600"></i> Accéder au dashboard
            </Link>
          </div>
          
          {/* Capture d'interface uploadée */}
          <div className="mt-12 rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-400">
               <img src="/dashboard-preview.png" alt="Interface E nova" className="w-full h-auto" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = 'Image Interface SaaS (Place dashboard-preview.png dans /public)'; }} />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="plans" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Aperçu des plans</h2>
            <p className="text-gray-600 mt-2">3 jours gratuits de Pro pour tester, sans carte bancaire.</p>
            <div className="mt-4 inline-flex items-center bg-amber-500/10 text-amber-600 px-4 py-2 rounded-full text-sm font-semibold">
              <i className="fas fa-gift mr-2"></i> L'abonnement annuel économise 2 mois !
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Plan Gratuit */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 opacity-75">
              <h3 className="text-lg font-semibold text-gray-500">Gratuit</h3>
              <div className="my-4"><span className="text-3xl font-bold text-gray-800">Sur demande</span></div>
              <p className="text-sm text-gray-500 mb-6">Uniquement pour les comptes hérités.</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-6">
                <li className="flex items-center"><i className="fas fa-check text-green-500 mr-2"></i> 30 commandes / mois</li>
                <li className="flex items-center"><i className="fas fa-check text-green-500 mr-2"></i> 5 produits max</li>
                <li className="flex items-center"><i className="fas fa-times text-red-400 mr-2"></i> 0 Landing page</li>
              </ul>
            </div>

            {/* Plan Pro */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-600 p-6 relative transform hover:-translate-y-1 transition">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAIRE</div>
              <h3 className="text-lg font-semibold text-blue-600">Pro</h3>
              <div className="my-4"><span className="text-3xl font-bold text-gray-900">1 000</span> <span className="text-gray-500">DZD/mois</span></div>
              <p className="text-sm text-gray-500 mb-6">Idéal pour une boutique avec pubs payantes.</p>
              <ul className="space-y-3 text-sm text-gray-700 mb-6">
                <li className="flex items-center"><i className="fas fa-check text-blue-600 mr-2"></i> Commandes illimitées</li>
                <li className="flex items-center"><i className="fas fa-check text-blue-600 mr-2"></i> 300 produits</li>
                <li className="flex items-center"><i className="fas fa-check text-blue-600 mr-2"></i> 3 Landing pages</li>
                <li className="flex items-center"><i className="fas fa-check text-blue-600 mr-2"></i> 1 Utilisateur</li>
              </ul>
              <Link to="/login" className="block text-center w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition">Choisir Pro</Link>
            </div>

            {/* Plan Illimité */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
              <h3 className="text-lg font-semibold text-gray-800">Illimité</h3>
              <div className="my-4"><span className="text-3xl font-bold text-gray-900">2 500</span> <span className="text-gray-500">DZD/mois</span></div>
              <p className="text-sm text-gray-500 mb-6">Pour boutiques multilingues et opérations CRM.</p>
              <ul className="space-y-3 text-sm text-gray-700 mb-6">
                <li className="flex items-center"><i className="fas fa-check text-green-500 mr-2"></i> Tout illimité</li>
                <li className="flex items-center"><i className="fas fa-check text-green-500 mr-2"></i> Produits illimités</li>
                <li className="flex items-center"><i className="fas fa-check text-green-500 mr-2"></i> Landing pages illimitées</li>
                <li className="flex items-center"><i className="fas fa-check text-green-500 mr-2"></i> 3 Utilisateurs</li>
              </ul>
              <Link to="/login" className="block text-center w-full bg-gray-800 text-white py-2 rounded-lg font-semibold hover:bg-gray-900 transition">Choisir Illimité</Link>
            </div>

            {/* Plan Entreprise */}
            <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 p-6 text-white">
              <h3 className="text-lg font-semibold text-amber-500">Entreprise</h3>
              <div className="my-4"><span className="text-3xl font-bold">5 500</span> <span className="text-gray-400">DZD/mois</span></div>
              <p className="text-sm text-gray-400 mb-6">Grandes équipes ayant besoin de nombreux sièges.</p>
              <ul className="space-y-3 text-sm text-gray-300 mb-6">
                <li className="flex items-center"><i className="fas fa-check text-amber-500 mr-2"></i> Tout illimité</li>
                <li className="flex items-center"><i className="fas fa-check text-amber-500 mr-2"></i> 25 sièges inclus (max 200)</li>
                <li className="flex items-center"><i className="fas fa-check text-amber-500 mr-2"></i> Support prioritaire</li>
              </ul>
              <Link to="/login" className="block text-center w-full bg-amber-500 text-gray-900 py-2 rounded-lg font-bold hover:bg-yellow-400 transition">Contacter</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="aide" className="bg-gray-50 border-t border-gray-200 pt-12 pb-8 text-center text-sm text-gray-500">
        &copy; 2026 E nova. Tous droits réservés.
      </footer>
    </div>
  );
}
