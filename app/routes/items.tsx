import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { requireManager } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";
import { ItemSchema } from "~/utils/validations";
import { useState, useEffect } from "react";

// Add loader to fetch items
export async function loader({ request }: LoaderFunctionArgs) {
  const manager = await requireManager(request);
  
  const items = await prisma.item.findMany({
    where: { userId: manager.id },
    select: {
      id: true,
      name: true,
      description: true,
      cogs: true,
    },
  });

  return json({ items });
}

// Update action to handle both create and delete
export async function action({ request }: ActionFunctionArgs) {
  const manager = await requireManager(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const itemId = formData.get("itemId") as string;
    await prisma.item.delete({
      where: { id: itemId },
    });
    return json({ success: true });
  }

  if (intent === "create" || intent === "edit") {
    try {
      const data = ItemSchema.parse({
        name: formData.get("name"),
        description: formData.get("description"),
        cogs: Number(formData.get("cogs")),
        user: { connect: { id: manager.id } },
      });

      if (intent === "edit") {
        const itemId = formData.get("itemId") as string;
        await prisma.item.update({
          where: { id: itemId },
          data: {
            name: data.name,
            description: data.description,
            cogs: data.cogs,
          },
        });
      } else {
        await prisma.item.create({ data });
      }
      return json({ success: true });
    } catch (error) {
      return json({ error: "Invalid form data" }, { status: 400 });
    }
  }
}

// Update component to match Pots layout
export default function NewItem() {
  const { items } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<null | typeof items[0]>(null);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Add this useEffect to close modal only on successful submission
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success) {
      closeModal();
      redirect("/items");
    }
  }, [actionData]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Manage Items</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>

          {/* Updated Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {editingItem ? 'Edit Item' : 'Add New Item'}
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
                    value={editingItem ? "edit" : "create"} 
                  />
                  {editingItem && (
                    <input type="hidden" name="itemId" value={editingItem.id} />
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
                      defaultValue={editingItem?.name}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      defaultValue={editingItem?.description || ''}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="cogs" className="block text-sm font-medium text-gray-700">
                      Cost of Goods Sold (R$/kg)
                    </label>
                    <input
                      type="number"
                      name="cogs"
                      id="cogs"
                      required
                      defaultValue={editingItem?.cogs || ''}
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
                      {editingItem ? 'Save Changes' : 'Add'}
                    </button>
                  </div>
                </Form>
              </div>
            </div>
          )}

          {/* Items List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Items</h3>
            {items.length === 0 ? (
              <p className="text-gray-500">No items yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        COGS
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{item.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${item.cogs.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 mr-4"
                          >
                            Edit
                          </button>
                          <Form method="post" className="inline">
                            <input type="hidden" name="intent" value="delete" />
                            <input type="hidden" name="itemId" value={item.id} />
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