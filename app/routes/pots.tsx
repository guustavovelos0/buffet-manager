import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { requireManager } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";
import { PotSchema } from "~/utils/validations";
import { useState, useEffect } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const manager = await requireManager(request);
  
  const pots = await prisma.pot.findMany({
    where: { userId: manager.id },
    select: {
      id: true,
      name: true,
      capacity: true,
      weight: true,
    },
  });

  return json({ pots });
}

export async function action({ request }: ActionFunctionArgs) {
  const manager = await requireManager(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const potId = formData.get("potId") as string;
    await prisma.pot.delete({
      where: { id: potId },
    });
    return json({ success: true });
  }

  if (intent === "create" || intent === "edit") {
    try {
      const data = PotSchema.parse({
        name: formData.get("name"),
        capacity: Number(formData.get("capacity")),
        weight: Number(formData.get("weight")),
        user: { connect: { id: manager.id } },
      });

      if (intent === "edit") {
        const potId = formData.get("potId") as string;
        await prisma.pot.update({
          where: { id: potId },
          data: {
            name: data.name,
            capacity: data.capacity,
            weight: data.weight,
          },
        });
      } else {
        await prisma.pot.create({ data });
      }
      return json({ success: true });
    } catch (error) {
      return json({ error: "Invalid form data" }, { status: 400 });
    }
  }
}

export default function Pots() {
  const { pots } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPot, setEditingPot] = useState<null | typeof pots[0]>(null);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPot(null);
  };

  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success) {
      closeModal();
    }
  }, [actionData]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Manage Pots</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Pot
            </button>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {editingPot ? 'Edit Pot' : 'Add New Pot'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <Form 
                  method="post" 
                  className="space-y-4"
                >
                  <input 
                    type="hidden" 
                    name="intent" 
                    value={editingPot ? "edit" : "create"} 
                  />
                  {editingPot && (
                    <input type="hidden" name="potId" value={editingPot.id} />
                  )}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      defaultValue={editingPot?.name}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                      Capacity (kg)
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      id="capacity"
                      step="0.1"
                      required
                      defaultValue={editingPot?.capacity}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      id="weight"
                      step="0.1"
                      required
                      defaultValue={editingPot?.weight}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  {actionData && 'error' in actionData && (
                    <p className="text-red-500 text-sm">{actionData.error}</p>
                  )}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      {editingPot ? 'Save Changes' : 'Add'}
                    </button>
                  </div>
                </Form>
              </div>
            </div>
          )}

          {/* Pots List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Pots</h3>
            {pots.length === 0 ? (
              <p className="text-gray-500">No pots yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacity (kg)
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight (kg)
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pots.map((pot) => (
                      <tr key={pot.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{pot.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pot.capacity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pot.weight}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingPot(pot);
                              setIsModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <Form method="post" className="inline">
                            <input type="hidden" name="intent" value="delete" />
                            <input type="hidden" name="potId" value={pot.id} />
                            <button
                              type="submit"
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </Form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}