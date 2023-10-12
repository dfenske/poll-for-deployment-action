# Poll for Deployment GitHub Action

This action blocks until a deployment is successful, and outputs its
URL to be used in subsequent steps.

This has only been tested with [Vercel](https://vercel.com), but it only uses
the GitHub Deployments API, so in theory it will work with any platform that
creates deployments on each push.

_Note: This was originally a fork of https://github.com/SFDigitalServices/wait-for-deployment-action/._

## Motivation

I wanted a way to alert in Slack based on a Github + Vercel deployment, but filter to only specific branches. I also wanted to be able to handle failures and successes differently. Many tools didn't quite satisfy these requirements.

## Simple Usage

```yml
name: Test
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: dfenske/poll-for-deployment-action@v1
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

### `timeoutSeconds`

The number of seconds after which to give up with an error. Default: 30.

### `intervalSeconds`

The number of seconds to wait between polls to the deployments API. Default: 5.

## Outputs

### `url`

The target URL of the deployment, if found.

## Example Usage to log success/failure to Slack, including Vercel Preview URL

```yaml
name: Report Vercel Deploy Status
on:
  push:
    branches:
      - "staging"
      - "main"

jobs:
  report:
    runs-on: ubuntu-latest

    env:
      GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

    steps:
      - uses: dfenske/poll-for-deployment-action@v1
        id: deployment
        with:
          github-token: ${{ env.GITHUB_TOKEN }}
          environment: Preview
          intervalSeconds: 10
          timeoutSeconds: 300
      - run: |
          curl -X POST --data-urlencode "payload={\"username\": \"Github (${{ github.repository }})\", \"text\": \":tada: The deployment succeeded on ${{ github.ref_name }}. This deployment was triggered by ${{ github.triggering_actor }}.\n\nVercel Preview Link: ${{ steps.deployment.outputs.url }} \", \"icon_emoji\": \":github-actions:\"}" "${{ env.SLACK_WEBHOOK_URL }}"

      - name: Report Failure
        if: failure()
        run: |
          curl -X POST --data-urlencode "payload={\"username\": \"Github (${{ github.repository	}})\", \"text\": \":fail: Failed or timed out after 5 minutes trying to find a successful deployment on ${{ github.ref_name }}. This deployment was triggered by ${{ github.triggering_actor }}.\n\nhttps://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }} \", \"icon_emoji\": \":github-actions:\"}" "${{ env.SLACK_WEBHOOK_URL }}"
```
