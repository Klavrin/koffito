import { cssInterop } from "nativewind";
import Animated from "react-native-reanimated";

// NativeWind only maps `className` for components it knows about.
// Register Reanimated's Animated.View so it accepts `className` alongside animated styles.
cssInterop(Animated.View, { className: "style" });
