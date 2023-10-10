const core = require("@actions/core");
const github = require("@actions/github");

const options = {
  environment: core.getInput("environment"),
  githubToken: core.getInput("github-token"),
  interval: core.getInput("intervalSeconds"),
  timeout: core.getInput("timeoutSeconds"),
};

waitForDeployment(options)
  .then((res) => {
    core.setOutput("id", res.deployment.id);
    core.setOutput("url", res.url);
  })
  .catch((error) => {
    core.setFailed(error.message);
  });

async function waitForDeployment(options) {
  const { githubToken, environment } = options;

  const timeout = parseInt(options.timeout) || 4 * 60;
  const interval = parseInt(options.interval) || 10;

  const { sha } = github.context;
  const octokit = github.getOctokit(githubToken);
  const start = Date.now();

  const params = {
    ...github.context.repo,
    environment,
    sha,
  };

  core.info(`Deployment params: ${JSON.stringify(params, null, 2)}`);

  while (true) {
    const { data: deployments } = await octokit.repos.listDeployments(params);

    for (const deployment of deployments) {
      core.info(
        `\tFound a deployment with id ${deployment.id}. Getting statuses for deployment...`
      );

      const { data: statuses } = await octokit.request(
        "GET /repos/:owner/:repo/deployments/:deployment/statuses",
        {
          ...github.context.repo,
          deployment: deployment.id,
        }
      );

      core.info(
        `\tFound ${statuses.length} status${statuses.length > 1 ? "es" : ""}`
      );

      const [success] = statuses.filter((status) => status.state === "success");

      if (success) {
        core.info(`\tFound a successful deployment!`);
        core.info(`\t${JSON.stringify(success, null, 2)}`);
        let deploymentUrl = success.target_url;
        const { payload = {} } = deployment;
        if (payload.web_url) {
          deploymentUrl = payload.web_url;
        }
        return {
          deployment,
          url: deploymentUrl,
        };
      } else {
        core.info(
          `No statuses with state === "success": "${statuses
            .map((status) => status.state)
            .join('", "')}"`
        );
      }

      await sleep(interval);
    }

    const elapsed = (Date.now() - start) / 1000;
    if (elapsed >= timeout) {
      core.setFailed(
        `Timing out after ${timeout} seconds (${elapsed} elapsed)`
      );
      return;
    }

    core.info(`Found 0 deployments, sleeping for ${interval} seconds...`);
    await sleep(interval);
  }
}

function sleep(seconds) {
  const ms = parseInt(seconds) * 1000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
