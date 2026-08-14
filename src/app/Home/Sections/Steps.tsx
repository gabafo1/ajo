function Steps() {
  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-900">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl xl:text-5xl">
            How does Alajo work?
          </h2>
          <p className="max-w-md mx-auto mt-5 text-base font-normal text-gray-600 dark:text-gray-300">
            Alajo makes it easy to manage your group savings cycle—from registration to contribution and payout—digitally and securely.
          </p>
        </div>

        <div className="flex flex-col items-center max-w-md mx-auto mt-8 lg:mt-20 lg:flex-row lg:max-w-none">

          {/* First card */}
          <div className="relative flex-1 w-full overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg">
            <div className="py-8 px-9">
              <div className="inline-flex items-center justify-center w-10 h-10 text-base font-bold text-white bg-gray-900 dark:bg-gray-700 rounded-xl">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mt-2 dark:text-white">Join or Create a Group</h3>
              <p className="mt-4 text-xl font-medium text-gray-900 dark:text-gray-300">
              Sign up and either join an existing ajo/esusu group or create your own with customized rules.
              </p>
            </div>
          </div>

          {/* Connector 1 */}
          <div className="hidden lg:block lg:-mx-2">
            <svg className="w-auto h-4 text-gray-300 dark:text-gray-600" viewBox="0 0 81 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line y1="-0.5" x2="18.0278" y2="-0.5" transform="matrix(-0.5547 0.83205 0.83205 0.5547 11 1)" stroke="currentColor" />
              <line y1="-0.5" x2="18.0278" y2="-0.5" transform="matrix(-0.5547 0.83205 0.83205 0.5547 46 1)" stroke="currentColor" />
            </svg>
          </div>

          {/* Second card */}
          <div className="relative flex-1 w-full mt-8 lg:mt-0">
            <div className="absolute -inset-4">
              <div
                className="w-full h-full mx-auto rotate-180 opacity-20 blur-lg filter"
                style={{
                  background:
                    'linear-gradient(90deg, #44ff9a -0.55%, #44b0ff 22.86%, #8b44ff 48.36%, #ff6644 73.33%, #ebff70 99.34%)',
                }}
              />
            </div>
            <div className="relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg">
              <div className="py-8 px-9">
                <div className="inline-flex items-center justify-center w-10 h-10 text-base font-bold text-white bg-gray-900 dark:bg-gray-700 rounded-xl">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mt-2 dark:text-white">Contribute Regularly</h3>
                <p className="mt-4 text-xl font-medium text-gray-900 dark:text-gray-300">
                  Members contribute their agreed amounts on a schedule. Alajo tracks and secures all payments.
                </p>
              </div>
            </div>
          </div>

          {/* Connector 2 */}
          <div className="hidden lg:block lg:-mx-2">
            <svg className="w-auto h-4 text-gray-300 dark:text-gray-600" viewBox="0 0 81 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line y1="-0.5" x2="18.0278" y2="-0.5" transform="matrix(-0.5547 0.83205 0.83205 0.5547 11 1)" stroke="currentColor" />
              <line y1="-0.5" x2="18.0278" y2="-0.5" transform="matrix(-0.5547 0.83205 0.83205 0.5547 46 1)" stroke="currentColor" />
            </svg>
          </div>

          {/* Last card */}
          <div className="relative flex-1 w-full mt-8 lg:mt-0">
            <div className="relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg">
              <div className="py-8 px-9">
                <div className="inline-flex items-center justify-center w-10 h-10 text-base font-bold text-white bg-gray-900 dark:bg-gray-700 rounded-xl">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mt-2 dark:text-white">
                  Receive Payouts
                </h3>
                <p className="mt-4 text-xl font-medium text-gray-900 dark:text-gray-300">
                  When it&apos;s your turn, you&apos;ll receive the pooled funds directly.
                  We manage the cycle transparently &amp; securely.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Steps;
