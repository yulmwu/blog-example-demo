package com.example.flink;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.SourceFunction;
import org.apache.flink.streaming.api.functions.windowing.ProcessAllWindowFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import org.apache.flink.util.OutputTag;

public class DataStreamJob {
    private static final int PARALLELISM = 1;
    private static final Duration MAX_OUT_OF_ORDERNESS = Duration.ofMinutes(2);
    private static final Time WINDOW_SIZE = Time.minutes(5);

    public static class Event {
        public final String name;
        public final long eventTime;

        public Event(String name, long eventTime) {
            this.name = name;
            this.eventTime = eventTime;
        }
    }

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(PARALLELISM);

        DataStream<Event> sourceStream = env.addSource(new TestSource());

        OutputTag<Event> lateDataTag = new OutputTag<Event>("late-data"){};

        DataStream<Event> withWatermarks = sourceStream.assignTimestampsAndWatermarks(
            WatermarkStrategy
                .<Event>forBoundedOutOfOrderness(MAX_OUT_OF_ORDERNESS)
                .withTimestampAssigner((event, ignored) -> event.eventTime)
        );

        SingleOutputStreamOperator<String> windowedResult = withWatermarks
            .windowAll(TumblingEventTimeWindows.of(WINDOW_SIZE))
            // .allowedLateness(Time.minutes(2))
            .sideOutputLateData(lateDataTag)
            .process(new WindowCollector())
            .returns(Types.STRING);

        windowedResult.print();

        windowedResult.getSideOutput(lateDataTag)
            .map(event -> String.format("Dropped (Side Output): %s", event))
            .print();

        env.execute("Flink Demo");
    }

    public static class TestSource implements SourceFunction<Event> {
        private volatile boolean running = true;

        @Override
        public void run(SourceContext<Event> ctx) throws Exception {
            emit(ctx, "E1", "10:04");
            Thread.sleep(1000);

            emit(ctx, "E2", "10:06");
            Thread.sleep(1000);

            emit(ctx, "E3", "10:03"); // out of order
            Thread.sleep(1000);

            emit(ctx, "E4", "10:07");
            Thread.sleep(1000);

            emit(ctx, "WM", "10:20");
            Thread.sleep(1000);

            while (running) {
                Thread.sleep(1000); // for keeping the source alive, do not use while loop in production
            }
        }

        private void emit(SourceContext<Event> ctx, String id, String time) {
            ctx.collect(new Event(id, ts(time)));
        }

        @Override
        public void cancel() {
            running = false;
        }
    }


    private static class WindowCollector extends ProcessAllWindowFunction<Event, String, TimeWindow> {
        @Override
        public void process(Context context, Iterable<Event> elements, Collector<String> out) {
            List<String> names = new ArrayList<>();
            for (Event e : elements) {
                names.add(e.name);
            }

            out.collect(
                String.format(
                    "window [%d ~ %d] -> %s",
                    context.window().getStart(),
                    context.window().getEnd(),
                    names
                )
            );
        }
    }

    private static long ts(String hhmm) {
        return LocalDateTime
            .parse("2026-01-01T" + hhmm + ":00")
            .toInstant(ZoneOffset.UTC)
            .toEpochMilli();
    }
}
