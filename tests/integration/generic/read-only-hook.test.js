const { scan } = require("../helpers");
const k8s = require('@kubernetes/client-node');

test(
  "localhost port scan should only find a host finding",
  async () => {
    await scan(
      "test-scan-read-only-hook",
      "test-scan",
      [],
      90
    );

    const webhook = "http-webhook";
    const namespace = "integration-tests";

    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

    function containsPod(item) {
      return item.metadata.name.includes(webhook)
    }

    let podName;
    await k8sApi.listNamespacedPod(namespace, 'true').then((res) => {
      let podArray = res.body.items.filter(containsPod);
      podName = podArray.pop().metadata.name;
    });

    const containerName = webhook;

    let containerLog = await k8sApi.readNamespacedPodLog(podName, namespace, containerName, false);
    expect(containerLog.body.includes("path: '/hallo-welt'")).toBe(true);
  },
  3 * 60 * 1000
);