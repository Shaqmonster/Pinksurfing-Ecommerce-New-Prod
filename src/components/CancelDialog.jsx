import { Dialog, Transition } from "@headlessui/react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { Fragment } from "react";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";

export default function CancelDialog({
  isOpen,
  setIsOpen,
  orderId,
  GetOrders,
}) {
  const [cookies] = useCookies([]);
  function closeModal() {
    setIsOpen(false);
  }

  const DeleteOrder = () => {
    console.log(orderId);
    console.log(cookies.token);
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/order/cancel-order/${orderId}/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      )
      .then((response) => {
        // console.log(response.data);
        toast.success("Order Cancelled", {
          position: "top-right",
          autoClose: "3000",
        });
        GetOrders();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-black p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 mb-4 text-red-600"
                  >
                    Cancel this Order ?
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-base text-black">
                      Are you sure you want to delete this order? This cannot be
                      undone.
                    </p>
                  </div>

                  <div className="mt-8 flex items-center gap-4 ">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        DeleteOrder();
                        closeModal();
                      }}
                    >
                      Cancel Order
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md border border-transparent  px-4 py-2 text-base font-medium text-black hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      Back <ArrowRightIcon className=" w-4 ml-1" />
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
