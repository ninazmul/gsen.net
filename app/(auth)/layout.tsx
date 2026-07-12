import Image from "next/image";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-gradient-to-b from-indigo-100/70 via-sky-50/50 to-gray-100 dark:from-gray-950 dark:via-[#111827] dark:to-gray-950 px-2 py-2 sm:px-4 sm:py-4 lg:px-8">
      <div className="relative isolate mx-auto flex w-full max-w-6xl flex-col rounded-3xl border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/75 backdrop-blur-2xl shadow-[0_30px_80px_-28px_rgba(17,24,39,0.45)] lg:min-h-[680px] lg:flex-row">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-[-5rem] h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl sm:right-[-2rem] sm:h-72 sm:w-72" />
          <div className="absolute -bottom-20 left-[-5rem] h-72 w-72 rounded-full bg-sky-400/20 blur-3xl sm:left-[-2rem]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-indigo-100/20 dark:from-white/5 dark:to-indigo-500/10" />
        </div>

        <aside className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center border-r border-gray-200/80 dark:border-white/10 p-10 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center space-y-6">
            <Image
              src="/assets/images/logo.png"
              alt="GESN NET Software"
              width={500}
              height={300}
              className="h-auto w-auto"
              priority
            />

            <p className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              Welcome Back
            </p>
            <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
              GESN NET Software
            </h1>
            <p className="max-w-md text-sm text-gray-600 dark:text-gray-300">
              Securely sign in to manage customers, billing, and expenses from
              one modern dashboard.
            </p>
          </div>
        </aside>

        <main className="relative flex justify-center w-full flex-1 flex-col p-4 sm:p-6 md:p-10 overflow-y-auto">
          <div className="flex flex-col lg:hidden">
            <div className="mb-4 flex justify-center">
              <Image
                src="/assets/images/logo.png"
                alt="GESN NET Software"
                width={500}
                height={300}
                className="h-[60px] w-auto"
                priority
              />
            </div>

            <div className="flex flex-1 items-center justify-center px-2 sm:px-3">
              <div className="mx-auto w-11/12 flex justify-center items-center">
                <div className="overflow-visible px-1 sm:px-0">{children}</div>
              </div>
            </div>

            <div className="mt-5 border-t border-gray-200/80 dark:border-gray-800 pt-4">
              <p className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                Welcome Back
              </p>
              <h1 className="mt-3 text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                GESN NET Software
              </h1>
              <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">
                Securely sign in to manage customers, billing, and expenses from
                one modern dashboard.
              </p>
            </div>
          </div>

          <div className="mx-auto hidden w-auto max-w-[92vw] sm:max-w-sm md:max-w-md p-1 sm:p-2 lg:block">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
