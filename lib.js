// @format
const core = require("@actions/core");
const fetch = require("cross-fetch");
const isPortReachable = require("is-port-reachable");
const { periodicExecution, TimeoutError } = require("periodic-execution");
const process = require("process");

const config = require("./config.js");

// TODO: Move within each function
const options = {
  hcloudToken: core.getInput("hcloud-token"),
  timeout: core.getInput("startup-timeout")
};

async function deleteServer(server_id) {
  let res;
  const URI = `${config.API}/servers/${server_id}`;
  try {
    res = await fetch(URI, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.hcloudToken}`,
        "User-Agent": config.USER_AGENT
      }
    });
  } catch (err) {
    core.setFailed(err.message);
  }

  if (res.status === 200) {
    //core.info("Hetzner Cloud Server deleted");
    return res;
  } else {
    core.setFailed(
      `When sending the request to Hetzner's API, an error occurred "${
        res.statusText
      }"`
    );
    return;
  }
}

async function destroy() {
  let res;
  const URI = `${config.API}/servers/`;
  try {
    res = await fetch(URI, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.hcloudToken}`,
        "User-Agent": config.USER_AGENT
      }
    });

    const body = await res.json();

    if (res.status !== 200) {
      core.setFailed(
        `When sending the request to Hetzner's API, an error occurred "${
          res.statusText
        }"`
      );
      return;
    }

    for (const server of body.servers) {
      core.info(`Deleting ${server.name}`);
      await deleteServer(server.id);
    }
    
  } catch (err) {
    core.setFailed(err.message);
  }

  if (res.status === 200) {
    core.info("Hetzner Cloud Server's destroyed");
    return res;
  } else {
    core.setFailed(
      `When sending the request to Hetzner's API, an error occurred "${
        res.statusText
      }"`
    );
    return;
  }
}

module.exports = {
  destroy,
};
