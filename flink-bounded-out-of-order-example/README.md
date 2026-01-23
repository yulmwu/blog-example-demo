```bash
# on macOS using Homebrew
brew install apache-flink
```

```bash
cd flink-demo
mvn clean package
```

```bash
java --add-opens java.base/java.lang=ALL-UNNAMED \
     --add-opens java.base/java.util=ALL-UNNAMED \
     -cp target/flink-demo-0.1.jar \
     com.example.flink.DataStreamJob | grep window
```
