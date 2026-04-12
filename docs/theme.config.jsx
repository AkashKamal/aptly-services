export default {
  logo: <strong>@aptly/services</strong>,
  project: {
    link: 'https://github.com/AkashKamal/aptly-services'
  },
  docsRepositoryBase: 'https://github.com/AkashKamal/aptly-services/tree/master/docs',
  footer: {
    text: (
      <span>
        {new Date().getFullYear()} ©{' '}
        <a href="https://aptly.build" target="_blank">
          Aptly Modular Platform
        </a>
        .
      </span>
    )
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – @aptly/services'
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="@aptly/services" />
      <meta property="og:description" content="Production-ready backend services for the Aptly modular platform." />
    </>
  )
}
