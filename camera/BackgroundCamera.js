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
import AppBottom from "../components/AppBottom";
// import { useFocusEffect } from "@react-navigation/native";

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
  uploadToServer,
  alertFailed,
  alertSuccess,
  uploadTransaction,
} from "../utils/utils";
import { Color, FontSize, FontFamily } from "../GlobalStyles";
import { StatusBar } from "expo-status-bar";
import constants from "expo-constants";
import { Worklets } from "react-native-worklets-core";
import { ColorSpace } from "react-native-reanimated";

function BackgroundCamera({  }) {
  // const { email, type, transactionDetails } = route.params;
  const test_email = "sci555@gmail.com"

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
  const [image64, setIMage64] = useState();
  // useFocusEffect(
  //   useCallback(() => {
  //     const onBackPress = () => {
  //       // Prevent default behavior of going back to the previous screen
  //       return true;
  //     };

  //     BackHandler.addEventListener("hardwareBackPress", onBackPress);

  //     return () =>
  //       BackHandler.removeEventListener("hardwareBackPress", onBackPress);
  //   }, [])
  // );
  // *********** alerts implementations
  const [alertBox, setAlertBox] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [typeAlert, setTypeAlert] = useState("nothing");
  const [text, setText] = useState("Okay");
  const format = useCameraDevice(device,[{
    photoResolution:{width:2464,height:3280}
  }])
  const hideAlert = () => {
    // validate and handle navigation
    if (serverFeed) {
      // navigate to
      setAlertBox(false);
      // navigation.reset({
      //   index: 0,
      //   routes: [{ name: "DashBoard", params: { email: email } }],
      // });
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
      setIMage64(image_base64);
      setPictures(pictures.push(image_base64));

      await recordingFinished(image_base64);
    } else {
      return;
    }
  };
  // after pictures
  const recordingFinished = async (dfile) => {
    setEtx("");
    setCameraActive(false);
    setVisible(true);
    const response = await uploadToServer(dfile, test_email, "login");
    if (response.ok && JSON.stringify(response).message === "matched") {
      if (type === "transfer") {
        const tranf = await uploadTransaction(transactionDetails);
        if (tranf.ok) {
          setServerFeed(true);
          setVisible(false);
          setTitle("Transaction Successful");
          setTypeAlert(alertSuccess.typeAlert);
          setMessage("Your transaction was successful!");
          setAlertBox(true);
        }
      } else if (type === "login") {
        setServerFeed(true);
        setVisible(false);
        setTitle(alertSuccess.title);
        setTypeAlert(alertSuccess.typeAlert);
        setMessage(alertSuccess.message);
        setAlertBox(true);
      }
    } else {
      setServerFeed(false);
      setVisible(false);
      setTitle("Authorization Failed");
      setTypeAlert(alertFailed.typeAlert);
      setMessage(
        "We couldn't recognize your face. Please double-check that you're looking directly at the camera and try again."
      );
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

  //
  const handleOnClose = () => {};
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
        <View
          // upper text here
          style={{
            top: "12%",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "white",
              fontFamily: FontFamily.interExtraBold,
              fontSize: FontSize.size_xl,
            }}
          >
            Use FACE ID to authorize
          </Text>
        </View>
        <View
          // upper text here
          style={{
            top: "17%",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "white",
              fontFamily: FontFamily.dMSansMedium,
              fontSize: FontSize.size_base,
            }}
          >
            Please put your phone in front of your face
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
                format={format}
              />
            </View>
          </View>
          <View style={styles.lottieContainer}>
            <LottieView
              source={require("../data/animatedFace.json")}
              autoPlay
              loopda
              style={styles.lottie1}
            ></LottieView>
          </View>
          <View
            // animation
            style={{
              flex: 1,
              top: "18%",
              position: "absolute",
              margin: 0,
              marginLeft: -73,
            }}
          >
            <LottieView
              source={require("../data/spiningcircles_placeFaceid.json")}
              autoPlay
              loop
              style={styles.lottie}
            ></LottieView>
          </View>
          <View
            style={{
              top: "82%",
              left: "25%",
            }}
          >
            {/* <AppBottom text={"Cancel"} onPress={handleOnClose} /> */}
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
          <AnimatedText
            newS={{
              color: "red",
            }}
            text={efText}
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
    backgroundColor: "#000000",
    height: "100%",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  cameraContainer: {
    top: "33%",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: "2%",
  },
  cameraWrapper: {
    width: 500,
    height: 300,
  },
  lottie: {
    width: 520,
    height: 520,
  },
  lottie1: {
    width: 150,
    height: 150,
  },
  lottieContainer: {
    position: "absolute",
    top: "40%",
    left: "35%",
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

export default BackgroundCamera;
