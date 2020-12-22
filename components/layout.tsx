import Header from './header'
import Footer from './footer'

type Layout = {
  children: JSX.Element| JSX.Element[];
};

export default function Layout({children}: Layout) {
  return (
    <>
      <Header/>
      <main>
        {children}
      </main>
      <Footer/>
    </>
  )
}