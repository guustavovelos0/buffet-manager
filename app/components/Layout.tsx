import { Form, Link, useLocation } from "@remix-run/react";
import type { User } from "@prisma/client";

interface LayoutProps {
  user: User | null;
  children: React.ReactNode;
}

export function Layout({ user, children }: LayoutProps) {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", show: true },
    { name: "Log Food", href: "/logs/new", show: !!user },
    { name: "Items", href: "/items", show: user?.role === "MANAGER" },
    { name: "Pots", href: "/pots", show: user?.role === "MANAGER" },
    { name: "Employees", href: "/employees", show: user?.role === "MANAGER" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-800">Buffet Manager</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map(
                  (item) =>
                    item.show && (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`${
                          location.pathname === item.href
                            ? "border-blue-500 text-gray-900"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                      >
                        {item.name}
                      </Link>
                    )
                )}
              </div>
            </div>
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">{user.email}</span>
                  <Form action="/logout" method="post">
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Logout
                    </button>
                  </Form>
                </div>
              ) : (
                <div className="space-x-4">
                  <Link
                    to="/login"
                    className="text-sm text-gray-700 hover:text-gray-900"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}