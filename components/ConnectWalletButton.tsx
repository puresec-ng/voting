import { useRouter } from 'next/router'
import styled from '@emotion/styled'
import { Menu } from '@headlessui/react'
import {
  BackspaceIcon,
  CheckCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/solid'
import { abbreviateAddress } from '@utils/formatting'
import { useCallback, useEffect, useState } from 'react'
import Switch from './Switch'
import { notify } from '@utils/notifications'
import { Profile, ProfileImage } from '@components/Profile'
import Loading from './Loading'
import { WalletName, WalletReadyState } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { ExternalLinkIcon } from '@heroicons/react/outline'
import { DEFAULT_PROVIDER } from '../utils/wallet-adapters'
import useViewAsWallet from '@hooks/useViewAsWallet'
import { ProfileName } from "@components/Profile/ProfileName";
import Modal from './Modal'
import Input, { InputProps } from './inputs/Input'
import { StyledLabel, StyledSuffix, inputClasses } from './inputs/styles'
import ErrorField from './inputs/ErrorField'
import Button from './Button'
import axios from 'axios'
import { ShortAddress } from './Profile/ShortAddress'
import { PublicKey } from '@solana/web3.js'

const StyledWalletProviderLabel = styled.p`
  font-size: 0.65rem;
  line-height: 1.5;
`

const ConnectWalletButton = (props) => {
  const { pathname, query, replace } = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const debugAdapter = useViewAsWallet()
  const [openModal, setOpenModal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const {
    wallets,
    select,
    disconnect,
    connect,
    wallet,
    publicKey: realPublicKey,
    connected,
  } = useWallet()

  const publicKey = debugAdapter?.publicKey ?? realPublicKey
  const connected2 = debugAdapter?.connected ?? connected

  const setCookie = (name, value, days) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  };
  const deleteCookie = (name) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  };
  const loginSocialConnector = async () => {
    if (email == '') {
      notify({ type: 'error', message: `Email is required` })
      return;
    }
    if (password == '') {
      notify({ type: 'error', message: `Password is required` })
      return;
    }
    setIsLoading(true)
    try {
      const response = await axios.post('https://gatewaytesting.socialconnector.io/api/v2/auth/login', {
        email: email,
        password: password
      }).then((res) => {
        setOpenModal(false);
        notify({ type: 'success', message: `Authorized` })
        const wallet_address = res.data.data.customer.custodial_wallet;
        localStorage.setItem('sc-details', JSON.stringify(res.data.data));
        setCookie('publicKey', wallet_address, 365);
        setCookie('token', res.data.data.token, 365);
        location.reload();
      }).catch((err) => {
        notify({ type: 'error', message: `${err.response.data.message}` })
      });

    } catch (ex) {
      notify({ type: 'error', message: `An Error Occured` })
      //console.error(ex)
      setIsLoading(false)
      // throw ex
    }
    setIsLoading(false)
  }
  useEffect(() => {
    if (wallet === null) select(DEFAULT_PROVIDER.name as WalletName)
  }, [select, wallet])

  const handleConnectDisconnect = useCallback(async () => {
    localStorage.removeItem('sc-details');
    deleteCookie('publicKey');
    deleteCookie('TOKEN');
    setIsLoading(true)
    try {
      if (connected) {
        await disconnect()
      } else {
        await connect()
      }
    } catch (e: any) {
      if (e.name === 'WalletNotReadyError') {
        notify({
          type: 'error',
          message: 'You must have a wallet installed to connect',
        })
      }
      console.warn('handleConnectDisconnect', e)
    }
    setIsLoading(false)
  }, [connect, connected, disconnect])

  const currentCluster = query.cluster

  function updateClusterParam(cluster) {
    const newQuery = {
      ...query,
      cluster,
    }
    if (!cluster) {
      delete newQuery.cluster
    }
    replace({ pathname, query: newQuery }, undefined, {
      shallow: true,
    })
  }

  function handleToggleDevnet() {
    updateClusterParam(currentCluster !== 'devnet' ? 'devnet' : null)
  }

  const walletAddressFormatted = publicKey ? abbreviateAddress(publicKey) : ''

  return (
    <div className="flex">
      {openModal && (
        <Modal isOpen={openModal} onClose={() => setOpenModal(false)}>
          <div className="flex flex-col gap-y-4">
            <h3>Login Social Connector</h3>
            <label>
              Email
            </label>
            <Input
              placeholder={'Email'}
              value={email}
              type="email"
              onChange={(e) => { setEmail(e.target.value) }}

            />
            <label>
              Password
            </label>
            <Input
              placeholder={'Password'}
              value={password}
              type="password"
              onChange={(e) => { setPassword(e.target.value) }}

            />
            <Button
              onClick={async () => {
                loginSocialConnector();
                // setOpenModal(false)
              }}
            >
              {isLoading ? <Loading></Loading> : 'Login'}
            </Button>
          </div>
        </Modal>
      )}
      <div
        disabled={connected2}
        className={`bg-bkg-2 hover:bg-bkg-3  border border-fgd-4 border-r-0 default-transition flex h-12 items-center pl-4 pr-3 sm:pl-1 sm:pr-2 rounded-l-full rounded-r-none ${connected2
          ? 'cursor-default'
          : 'cursor-pointer hover:bg-bkg-3 focus:outline-none'
          }`}
        onClick={handleConnectDisconnect}
        {...props}
      >
        <div className="relative flex items-center text-sm font-bold text-left text-fgd-1">
          {
            // TODO bring back debug wallet
          }

          {connected2 && publicKey ? (
            <div className="hidden w-12 pr-2 sm:block">
              <ProfileImage publicKey={publicKey} expanded={false} className="h-9 text-fgd-3 w-9" />
            </div>
          ) : (
            <div className="hidden pl-2 pr-2 sm:block">
              <img src={wallet?.adapter.icon} className="w-5 h-5" />
            </div>
          )}
          <div>
            {connected2 && publicKey ? (
              <>
                {connected2 && publicKey ? (
                  <ProfileName
                    publicKey={publicKey}
                    width="100px"
                    height="20px"
                    dark={true}
                  />
                ) : null}
                <StyledWalletProviderLabel className="font-normal text-fgd-3">
                  {walletAddressFormatted}
                </StyledWalletProviderLabel>
              </>
            ) : (
              <>
                {isLoading ? <Loading></Loading> : 'Connect'}
                <StyledWalletProviderLabel className="font-normal text-fgd-3">
                  {wallet?.adapter.name}
                </StyledWalletProviderLabel>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative ">
        <Menu>
          {({ open }) => (
            <>
              <Menu.Button
                className={`border bg-bkg-2 border-fgd-4 cursor-pointer default-transition h-12 w-12 py-2 px-2 rounded-r-full hover:bg-bkg-3 focus:outline-none`}
              >
                <ChevronDownIcon
                  className={`${open ? 'transform rotate-180' : 'transform rotate-360'
                    } default-transition h-5 m-auto ml-1 text-primary-light w-5`}
                />
              </Menu.Button>
              <Menu.Items className="absolute right-0 z-20 w-48 p-2 border rounded-md shadow-md outline-none bg-bkg-1 border-fgd-4 top-14">
                <>
                  {wallets
                    .filter(
                      ({ adapter }) =>
                        adapter.readyState !== WalletReadyState.Unsupported
                    )
                    .map(({ adapter: { icon, name } }) => (
                      <Menu.Item key={name}>
                        <button
                          className="flex items-center w-full p-2 font-normal default-transition h-9 hover:bg-bkg-3 hover:cursor-pointer hover:rounded focus:outline-none"
                          onClick={() => {

                            select(name)
                          }}
                        >
                          <img src={icon} className="w-4 h-4 mr-2" />
                          <span className="text-sm">{name}</span>

                          {wallet?.adapter.name === name ? (
                            <CheckCircleIcon className="w-5 h-5 ml-2 text-green" />
                          ) : null}
                        </button>
                      </Menu.Item>
                    ))}
                  <Menu.Item key={'sc'}>
                    <button
                      className="flex items-center w-full p-2 font-normal default-transition h-9 hover:bg-bkg-3 hover:cursor-pointer hover:rounded focus:outline-none"
                      onClick={() => setOpenModal(true)}
                    >
                      <img src="https://raw.githubusercontent.com/puresec-ng/gary/main/GARY_coin.jpg" className="w-4 h-4 mr-2" />
                      <span className="text-sm">Social Connector</span>
                    </button>
                  </Menu.Item>
                  <Menu.Item key={'devnet'}>
                    <div className="flex items-center w-full p-2 font-normal default-transition h-9 hover:bg-bkg-3 hover:cursor-pointer hover:rounded focus:outline-none">
                      <span className="text-sm">Devnet</span>
                      <Switch
                        checked={currentCluster === 'devnet'}
                        onChange={() => {
                          handleToggleDevnet()
                        }}
                      />
                    </div>
                  </Menu.Item>
                  {wallet && publicKey && (
                    <>
                      <hr
                        className={`border border-fgd-3 opacity-50 mt-2 mb-2`}
                      ></hr>
                      <Menu.Item key={'profile'}>
                        <div className="p-2">
                          <Profile />
                        </div>
                      </Menu.Item>
                      <hr
                        className={`border border-fgd-3 opacity-50 mt-2 mb-2`}
                      ></hr>
                      <Menu.Item key={'disconnect'}>
                        <button
                          className="flex items-center w-full p-2 font-normal default-transition h-9 hover:bg-bkg-3 hover:cursor-pointer hover:rounded focus:outline-none"
                          onClick={handleConnectDisconnect}
                        >
                          <BackspaceIcon className="w-4 h-4 mr-2" />
                          <span className="text-sm">Disconnect</span>
                        </button>
                      </Menu.Item>
                    </>
                  )}
                  <hr className="border border-fgd-3 opacity-50 mt-2 mb-2 sm:hidden" />
                  <Menu.Item>
                    <a
                      className="flex items-center p-2 rounded transition-colors sm:hidden hover:bg-bkg-3"
                      href="https://docs.realms.today/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLinkIcon className="w-4 h-4 mr-2 stroke-white" />
                      <div className="text-white text-sm">Read the Docs</div>
                    </a>
                  </Menu.Item>
                </>
              </Menu.Items>
            </>
          )}
        </Menu>
      </div>
    </div>
  )
}

export default ConnectWalletButton
