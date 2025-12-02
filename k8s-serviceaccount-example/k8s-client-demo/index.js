const k8s = require('@kubernetes/client-node')

const kc = new k8s.KubeConfig()
kc.loadFromDefault()

kc.makeApiClient(k8s.CoreV1Api)
    .listNamespace()
    .then((res) => console.log(res.items.map((ns) => ns.metadata.name)))
    .catch((err) => console.error('Error fetching pods:', err))
