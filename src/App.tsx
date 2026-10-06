import { BrowserRouter } from 'react-router';
import { Suspense } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeContextProvider, LoadingProvider } from 'context/index';
import { AppRoutes } from 'routes';
import store, { persistor } from 'store';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <>
      <ThemeContextProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <LoadingProvider>
              <BrowserRouter>
                <Suspense fallback={null}>
                  <AppRoutes />
                </Suspense>
                <ToastContainer />
              </BrowserRouter>
            </LoadingProvider>
          </PersistGate>
        </Provider>
      </ThemeContextProvider>
    </>
  );
}

export default App;
