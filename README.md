# Poll for Deployment GitHub Action

This action blocks until a deployment is successful, and outputs its
URL to be used in subsequent steps.

This has only been tested with [Vercel](https://vercel.com), but it only uses
the GitHub Deployments API, so in theory it will work with any platform that
creates deployments on each push.

## Setup

```yml
name: Test
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: dfenske/wait-for-deployment-action@v3
        id: deployment
        with:
          github-token: ${{ github.token }}
          environment: Preview

      - run: echo "Deployed to: ${{ steps.deployment.outputs.url }}"
```

## Inputs

### `github-token`

This is your GitHub access token, typically accessible via `${{ github.token }}`.

### `environment`

This is the deployment environment to target. The Vercel integration deploys
every push to the `Preview` environment, and pushes the default branch to
`Production`.

### `timeout`

The number of seconds after which to give up with an error. Default: 30.

### `interval`

The number of seconds to wait between polls to the deployments API. Default: 5.

## Outputs

### `url`

The target URL of the deployment, if found.
