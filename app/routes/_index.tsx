import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Buffet Manager - Dashboard" },
    { name: "description", content: "Manage your buffet operations efficiently" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  const [totalProduction, totalWaste, items] = await Promise.all([
    prisma.log.aggregate({
      where: { type: "PRODUCTION" },
      _sum: { weight: true },
    }),
    prisma.log.aggregate({
      where: { type: "WASTE" },
      _sum: { weight: true },
    }),
    prisma.item.findMany({
      select: {
        id: true,
        name: true,
        logs: {
          select: {
            type: true,
            weight: true,
          },
        },
      },
    }),
  ]);

  const itemStats = items.map((item) => ({
    id: item.id,
    name: item.name,
    production: item.logs
      .filter((log) => log.type === "PRODUCTION")
      .reduce((sum, log) => sum + log.weight, 0),
    waste: item.logs
      .filter((log) => log.type === "WASTE")
      .reduce((sum, log) => sum + log.weight, 0),
  }));

  return json({
    user,
    stats: {
      totalProduction: totalProduction._sum.weight || 0,
      totalWaste: totalWaste._sum.weight || 0,
      items: itemStats,
    },
  });
}

export default function Index() {
  const { user, stats } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Welcome, {user.email}
      </h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Production
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.totalProduction.toFixed(2)} kg
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Waste
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.totalWaste.toFixed(2)} kg
            </dd>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Production
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Waste
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.production.toFixed(2)} kg
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.waste.toFixed(2)} kg
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}