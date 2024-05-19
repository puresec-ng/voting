import useQueryContext from '@hooks/useQueryContext'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ThemeSwitch from './ThemeSwitch'
import DialectNotifications from './Dialect'

const ConnectWalletButtonDynamic = dynamic(
  async () => await import('./ConnectWalletButton'),
  { ssr: false }
)

const NavBar = () => {
  const { fmtUrlWithCluster } = useQueryContext()

  // @ts-ignore
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-12 relative z-20">
      <div className="flex items-center justify-between h-20 col-span-12 px-4 xl:col-start-2 xl:col-span-10 md:px-8 xl:px-4">
        <Link href={fmtUrlWithCluster('/realms')}>
          <div className="flex cursor-pointer sm:items-center min-w-[38px]">
            <picture>
              <source
                srcSet="https://gary.club/assets/imgs/garylogowhite.png"
                media="(min-width: 640px)"
              />
              <img src="https://gary.club/assets/imgs/garylogowhite.png" className="" width="50%"/>
            </picture>
          </div>
        </Link>
        <div className="flex items-center justify-end space-x-2 md:space-x-4">
          {/* <a
            className="border-b border-transparent items-center cursor-pointer -mb-[1px] transition-colors hidden sm:flex hover:border-white"
            href="https://docs.realms.today/"
            target="_blank"
            rel="noreferrer"
          >
            <div className="text-white text-sm">Read the Docs</div>
            <ExternalLinkIcon className="stroke-white h-4 w-4 ml-2" />
          </a> */}
          <ThemeSwitch />
          <DialectNotifications />
          <ConnectWalletButtonDynamic />
        </div>
      </div>
    </div>
  )
}

export default NavBar
