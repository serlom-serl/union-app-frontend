import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  Button,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import AnimatedText from "../effects/AnimatedText";
import Processing from "../effects/processing";
import RNFS from "react-native-fs";
import { useFocusEffect } from "@react-navigation/native";

import {
  useCameraPermission,
  useCameraDevice,
  Camera,
  useFrameProcessor,
} from "react-native-vision-camera";
import {
  Face,
  useFaceDetector,
  FaceDetectionOptions,
} from "react-native-vision-camera-face-detector";

import Alerts from "../effects/Alerts";
import LottieView from "lottie-react-native";
import {
  renderText,
  sleep,
  uploadToServerEnroll,
  alertFailed,
  alertSuccess,
} from "../utils/utils";
import { Color, FontSize, FontFamily } from "../GlobalStyles";
import { StatusBar } from "expo-status-bar";
import constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import { Worklets } from "react-native-worklets-core";
import { ColorSpace } from "react-native-reanimated";
import { color } from "react-native-elements/dist/helpers";

function FaceEnrollCamera({ navigation, route }) {
  const { email } = route.params;
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraActive, setCameraActive] = useState(true);
  const { preview, setPreview } = useState(true);
  const device = useCameraDevice("front");
  const [fac, setFaces] = useState(0);
  const cameraRef = useRef(null);
  const [isVisible, setVisible] = useState(false);
  const [serverFeed, setServerFeed] = useState();
  const [pictures, setPictures] = useState([]);
  const [efText, setEtx] = useState(
    "No face detected. Please position your face in the frame."
  );
  const handleCancel = () => {
    setPictures([]);
    navigation.replace("FaceAuthen", {
      email: email,
    });
    return;
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Prevent default behavior of going back to the previous screen
        return true;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );
  // *********** alerts implementations
  const [alertBox, setAlertBox] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [typeAlert, setTypeAlert] = useState("nothing");
  const [text, setText] = useState("Okay");
  const hideAlert = () => {
    // validate and handle navigation
    if (serverFeed) {
      // navigate to
      setAlertBox(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "DashBoard", params: { email: email } }],
      });
    } else {
      // restart the process with email
      setAlertBox(false);
      setCameraActive(true);
      setPictures([]);
    }
  };
  //***************** Detections imple */

  const faceDetectionOptions =
    useRef <
    FaceDetectionOptions >
    {
      // detection options
      landmarkMode: true,
      contourMode: true,
      classificationMode: true,
      performanceMode: "fast",
      minFaceSize: 0.1,
    }.current;
  const { detectFaces } = useFaceDetector(faceDetectionOptions);

  // handle detections
  const camera = useRef < Camera > null;
  const handleDetectedFaces = Worklets.createRunOnJS((faces) => {
    setFaces(faces.length);
  });

  //
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      const faces = detectFaces(frame);
      // ... chain frame processors
      // ... do something with frame
      handleDetectedFaces(faces);
    },
    [handleDetectedFaces]
  );
  /*
   ************************************************************
   */
  const handlePermission = async () => {
    await requestPermission();
  };

  useEffect(() => {
    if (!hasPermission) {
      handlePermission();
    }
  }, []);

  useEffect(() => {
    //
    setEtx(renderText(fac));
  }, [fac]);
  // take pictures
  const takePicutres = async () => {
    await sleep(3000);

    if (fac == 1 && pictures.length == 0) {
      const file = await cameraRef.current.takePhoto({
        enableShutterSound: false,
        photoCodec: "jpeg",
        enableAutoHdr: true,
        enableNightMode: true,
      });
      const image_base64 = await RNFS.readFile(file.path, "base64");
      // const result = await fetch(`file://${file.path}`);
      // const data = await result.blob();
      // setPictures(pictures.push(data));
      await recordingFinished(image_base64, email);
    }
  };
  // after pictures
  const recordingFinished = async (data, mail) => {
    setEtx("");
    setCameraActive(false);
    setVisible(true);
    const response = await uploadToServerEnroll(data, mail);

    if (response.ok) {
      setServerFeed(true);
      setVisible(false);
      setTitle(alertSuccess.title);
      setTypeAlert(alertSuccess.typeAlert);
      setMessage(alertSuccess.message);
      setText("Okay");
      setAlertBox(true);
    } else {
      setServerFeed(false);
      setVisible(false);
      setTitle(alertFailed.title);
      setTypeAlert(alertFailed.typeAlert);
      setMessage(alertFailed.message);
      setText("Retry");
      setAlertBox(true);
    }
  };
  ///
  // useEffect(() => {
  //   if (pictures.length == 1) {
  //     recordingFinished(pictures, email);
  //   }
  // }, [pictures.length]);
  ///
  useEffect(() => {
    if (fac == 1) {
      takePicutres();
    }
  }, [fac]);
  const renderNoPermission = () => (
    <>
      <StatusBar backgroundColor={Color.colorDarkslateblue_200} />
      <View style={styles.noPermission}>
        <Text>Camera permission is not granted</Text>
        <Button title="Request Permission" onPress={handlePermission} />
      </View>
    </>
  );

  if (!hasPermission) {
    return renderNoPermission();
  }
  if (device == null) {
    console.log("No camera device");
  }
  return (
    <>
      <StatusBar backgroundColor={Color.colorDarkslateblue_200} />
      <View style={styles.container}>
        <View style={styles.displayText}>
          <FontAwesome5
            name="unlock-alt"
            size={24}
            color={Color.colorDarkslateblue_200}
            style={styles.iconlock}
          />
          <Text style={styles.textStyle}>
            Hold the phone still. Rotate your
          </Text>
          <Text style={styles.goslow}> Head. Go slow </Text>
          <Text style={[styles.captureall, styles.defaultTextstyle]}>
            Position your face in the circle
          </Text>
        </View>
        <View style={styles.camera}>
          <View style={styles.cameraContainer}>
            <View style={styles.cameraWrapper}>
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={cameraActive}
                resizeMode="cover"
                preview={preview}
                frameProcessor={frameProcessor}
                photo={true}
                ref={cameraRef}
                photoQualityBalance="quality"
                enableDepthData
                outputOrientation="device"
              />
            </View>
          </View>
          <View style={styles.lottieContainer}>
            <LottieView
              source={require("../data/roundSpining.json")}
              autoPlay
              loop
              style={styles.lottie}
            ></LottieView>
          </View>
          <View style={styles.buttonCancel}>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.textCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Alerts
          hideVerifyAlert={hideAlert}
          message={message}
          title={title}
          typeOfAlert={typeAlert}
          showAlert={alertBox}
          text={text}
        />
        <View style={styles.animationT}>
          <AnimatedText text={efText} />
        </View>
        <View style={styles.Processing}>
          <Processing
            text={"Analyzing facial features. Please Wait..."}
            isVisible={isVisible}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  noPermission: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: constants.statusBarHeight,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    paddingTop: constants.statusBarHeight,
    width: "100%",
    justifyContent: "center",
    backgroundColor: Color.lightPrimaryKeyBackground,
    height: "100%",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  cameraContainer: {
    top: "30%",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: "20%",
  },
  cameraWrapper: {
    width: 250,
    height: 250,
    borderRadius: 150, //
    overflow: "hidden",
  },
  lottie: {
    width: 455,
    height: 490,
  },
  lottieContainer: {
    position: "absolute",
    top: "15%",
    left: "1%",
    marginLeft: -26,
  },
  buttonCancel: {
    top: "80%",
    left: "8%",
  },
  textCancel: {
    color: "#248DE2",
    fontSize: FontSize.size_xl,
    fontFamily: FontFamily.poppinsLight,
    fontWeight: "bold",
  },
  displayText: {
    top: "10%",
  },
  iconlock: {
    left: "50%",
  },
  goslow: {
    top: 30,
    textAlign: "center",
    fontSize: FontSize.size_xl,
    fontWeight: "800",
    fontFamily: FontFamily.interExtraBold,
    color: Color.colorDarkslateblue_200,
  },
  defaultTextstyle: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.interRegular,
    color: Color.colorDarkslateblue_200,
    fontWeight: "400",
  },
  captureall: {
    top: 40,
    textAlign: "center",
  },
  textStyle: {
    top: 20,
    width: "100%",
    textAlign: "center",
    fontSize: FontSize.size_xl,
    fontWeight: "800",
    fontFamily: FontFamily.interExtraBold,
    color: Color.colorDarkslateblue_200,
  },
  animationT: {
    flex: 1,
    position: "absolute",
    top: "30%",
    justifyContent: "center",
    width: "100%",
    left: "9%",
  },
  Processing: {},
});

export default FaceEnrollCamera;
