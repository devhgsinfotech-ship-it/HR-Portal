import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  resetAllMode,
  setDataCard,
  setDataColor,
  setDataColorAll,
  setDataLayout,
  setDataSidebar,
  setDataSidebarAll,
  setDataSidebarBg,
  setDataTheme,
  setDataTopbarAll,
  setDataTopbarBg,
  setDataTopBarColorAll,
  setDataWidth,
  setLoader,
  setRtl,
  setTopBarColor,
  setTopBarColor2,
} from "../../data/redux/themeSettingSlice";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import { ColorPicker } from 'antd';
import type { ColorPickerProps, GetProp } from 'antd';

type Color = Extract<GetProp<ColorPickerProps, 'value'>, string | { cleared: any }>;
const ThemeSettings = () => {
  const buyNow = () => {
    window.open('https://themeforest.net/item/smarthr-react-admin-template/28253842?s_rank=21','_blank')
  }
  const dispatch = useDispatch();
  const dataLayout = useSelector((state: any) => state.themeSetting.dataLayout);
  const dataWidth = useSelector((state: any) => state.themeSetting.dataWidth);
  const dataCard = useSelector((state: any) => state.themeSetting.dataCard);
  const dataTopBar = useSelector((state: any) => state.themeSetting.dataTopBar);
  const dataTopBarColor = useSelector((state: any) => state.themeSetting.dataTopBarColor);
  const dataTheme = useSelector((state: any) => state.themeSetting.dataTheme);
  const dataSidebarAll = useSelector((state: any) => state.themeSetting.dataSidebarAll);
  const dataColorAll = useSelector((state: any) => state.themeSetting.dataColorAll);
  const dataTopBarColorAll = useSelector((state: any) => state.themeSetting.dataTopBarColorAll);
  const dataTopbarAll = useSelector((state: any) => state.themeSetting.dataTopbarAll);
  const dataSidebar = useSelector(
    (state: any) => state.themeSetting.dataSidebar
  );
  const dataSidebarBg = useSelector(
    (state: any) => state.themeSetting.dataSidebarBg
  );
  const dataTopbarBg = useSelector(
    (state: any) => state.themeSetting.dataTopbarBg
  );
  const dataColor = useSelector((state: any) => state.themeSetting.dataColor);
  const dataLoader = useSelector((state: any) => state.themeSetting.dataLoader);
  const [colorRgb, setColorRgb] = useState<Color>(`rgb(${dataSidebarAll})`);
  const [colorRgb2, setColorRgb2] = useState<Color>(`rgb(${dataTopbarAll})`);
  const [colorRgb3, setColorRgb3] = useState<Color>(`rgb(${dataTopBarColorAll})`);
  const [colorRgb4, setColorRgb4] = useState<Color>(`rgb(${dataColorAll})`);
  const rgbString = React.useMemo(
    () => (typeof colorRgb === 'string' ? colorRgb : colorRgb?.toRgbString()),
    [colorRgb],
  );
  const rgbString2 = React.useMemo(
    () => (typeof colorRgb2 === 'string' ? colorRgb2 : colorRgb2?.toRgbString()),
    [colorRgb2],
  );
  const rgbString3 = React.useMemo(
    () => (typeof colorRgb3 === 'string' ? colorRgb3 : colorRgb3?.toRgbString()),
    [colorRgb3],
  );
  const rgbString4 = React.useMemo(
    () => (typeof colorRgb4 === 'string' ? colorRgb4 : colorRgb4?.toRgbString()),
    [colorRgb4],
  );
useEffect(() => {
  dispatch(setDataSidebarAll(rgbString.replace(/rgb\(|\)/g, "").trim()));
  dispatch(setDataTopbarAll(rgbString2.replace(/rgb\(|\)/g, "").trim()));
  dispatch(setDataTopBarColorAll(rgbString3.replace(/rgb\(|\)/g, "").trim()));
  dispatch(setDataColorAll(rgbString4.replace(/rgb\(|\)/g, "").trim()));
}, [dispatch, rgbString,rgbString2,rgbString3,rgbString4])

  const handleLayoutChange = (layout: string) => {
    dispatch(setDataLayout(layout));
  };
  const handleLayoutWidthChange = (layout: string) => {
    dispatch(setDataWidth(layout));
  };
  const handleBorderChange = (layout: string) => {
    dispatch(setDataCard(layout));
  };
  const handleTopBarColorChange = (color: string) => {
    dispatch(setTopBarColor(color));
  };
  const handleTopBarColorChange2 = (color: string) => {
    dispatch(setTopBarColor2(color));
  };
  const handleDataThemeChange = (theme: string) => {
    dispatch(setDataTheme(theme));
  };
  const handleDataSidebarChange = (theme: string) => {

    dispatch(setDataSidebar(theme));
  };

  const handleDataColorChange = (bg: string) => {
    dispatch(setDataColor(bg));
  };


  const handleReset = () => {
    dispatch(resetAllMode());
  };
  useEffect(() => {
    document.documentElement.setAttribute("data-layout", dataLayout);
    document.documentElement.setAttribute("data-width", dataWidth);
    document.documentElement.setAttribute("data-card", dataCard);
    document.documentElement.setAttribute("data-sidebar", dataSidebar);
    document.documentElement.setAttribute("data-theme", dataTheme);
    document.documentElement.setAttribute("data-topbar", dataTopBar);
    document.documentElement.setAttribute("data-topbarcolor", dataTopBarColor);
    document.documentElement.setAttribute("data-color", dataColor);
    document.documentElement.setAttribute("data-loader", dataLoader);
    document.body.setAttribute("data-sidebarbg", dataSidebarBg);
    document.body.setAttribute("data-topbarbg", dataTopbarBg);
    setColorRgb(`rgb(${dataSidebarAll})`)
    setColorRgb2(`rgb(${dataTopbarAll})`)
    setColorRgb3(`rgb(${dataTopBarColorAll})`)
    setColorRgb4(`rgb(${dataColorAll})`)
  },[dataLayout,dataWidth,dataSidebar,dataSidebarAll,dataTheme,dataSidebarBg,dataTopBarColor,dataTopBar,dataTopbarBg,dataColor,dataLoader,dataColorAll,dataTopBarColorAll,dataTopbarAll,dataCard])
  return (
    <>
    <div className="sidebar-contact ">
      <div
        className="toggle-theme"
        data-bs-toggle="offcanvas"
        data-bs-target="#theme-setting"
      >
        <i className="fa fa-cog fa-w-16 fa-spin" />
      </div>
    </div>
    <div
      className="sidebar-themesettings offcanvas offcanvas-end"
      id="theme-setting"
    >
      <div className="offcanvas-header d-flex align-items-center justify-content-between bg-dark">
        <div>
          <h3 className="mb-1 text-white">Theme Customizer</h3>
          <p className="text-light">Choose your themes &amp; layouts etc.</p>
        </div>
        <Link
          to="#"
          className="custom-btn-close d-flex align-items-center justify-content-center text-white"
          data-bs-dismiss="offcanvas"
        >
          <i className="ti ti-x" />
        </Link>
      </div>
      <div className="themesettings-inner offcanvas-body">
        <div
          className="accordion accordion-customicon1 accordions-items-seperate"
          id="settingtheme"
        >
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button
                className="accordion-button text-dark fs-16"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#layoutsetting"
                aria-expanded="true"
                aria-controls="collapsecustomicon1One"
              >
                Select Layouts
              </button>
            </h2>
            <div id="layoutsetting" className="accordion-collapse collapse show">
              <div className="accordion-body">
                <div className="row gx-3">
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="LayoutTheme"
                        id="defaultLayout"
                        checked={dataLayout === "default" ? true : false}
                        onChange={() => handleLayoutChange("default")}
                      />
                      <label htmlFor="defaultLayout">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/default.svg" alt="img" />
                        </span>
                        <span className="layout-type">Default</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="LayoutTheme"
                        id="miniLayout"
                        checked={dataLayout === "mini" ? true : false}
                        onChange={() => handleLayoutChange("mini")}
                      />
                      <label htmlFor="miniLayout">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/mini.svg" alt="img" />
                        </span>
                        <span className="layout-type">Mini</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="LayoutTheme"
                        id="horizontalLayout"
                        checked={dataLayout === "horizontal" ? true : false}
                        onChange={() => handleLayoutChange("horizontal")}
                      />
                      <label htmlFor="horizontalLayout">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/horizontal.svg" alt="img" />
                        </span>
                        <span className="layout-type">Horizontal</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="LayoutTheme"
                        id="horizontal-singleLayout"
                        value="horizontal-single"
                        checked={dataLayout === "horizontal-single" ? true : false}
                        onChange={() => handleLayoutChange("horizontal-single")}
                      />
                      <label htmlFor="horizontal-singleLayout">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath
                            src="assets/img/theme/horizontal-single.svg"
                            alt="img"
                          />
                        </span>
                        <span className="layout-type">Horizontal Single</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="LayoutTheme"
                        id="detachedLayout"
                        value="detached"
                        checked={dataLayout === "detached" ? true : false}
                        onChange={() => handleLayoutChange("detached")}
                      />
                      <label htmlFor="detachedLayout">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath
                            src="assets/img/theme/horizontal-single.svg"
                            alt="img"
                          />
                        </span>
                        <span className="layout-type">Detached</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="LayoutTheme"
                        id="twocolumnLayout"
                        value="twocolumn"
                        checked={dataLayout === "twocolumn" ? true : false}
                        onChange={() => handleLayoutChange("twocolumn")}
                      />
                      <label htmlFor="twocolumnLayout">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/two-column.svg" alt="img" />
                        </span>
                        <span className="layout-type">Two Column</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="LayoutTheme"
                        id="without-headerLayout"
                        value="without-header"
                        checked={dataLayout === "without-header" ? true : false}
                        onChange={() => handleLayoutChange("without-header")}
                      />
                      <label htmlFor="without-headerLayout">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath
                            src="assets/img/theme/without-header.svg"
                            alt="img"
                          />
                        </span>
                        <span className="layout-type">Without Header</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="LayoutTheme"
                        id="horizontal-overlayLayout"
                        value="horizontal-overlay"
                        checked={dataLayout === "horizontal-overlay" ? true : false}
                        onChange={() => handleLayoutChange("horizontal-overlay")}
                      />
                      <label htmlFor="horizontal-overlayLayout">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/overlay.svg" alt="img" />
                        </span>
                        <span className="layout-type">Overlay</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="LayoutTheme"
                        id="horizontal-sidemenuLayout"
                        value="horizontal-sidemenu"
                        checked={dataLayout === "horizontal-sidemenu" ? true : false}
                        onChange={() => handleLayoutChange("horizontal-sidemenu")}
                      />
                      <label htmlFor="horizontal-sidemenuLayout">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/menu-aside.svg" alt="img" />
                        </span>
                        <span className="layout-type">Menu Aside</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="LayoutTheme"
                        id="stackedLayout"
                        value="stacked"
                        checked={dataLayout === "stacked" ? true : false}
                        onChange={() => handleLayoutChange("stacked")}
                      />
                      <label htmlFor="stackedLayout">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/stacked.svg" alt="img" />
                        </span>
                        <span className="layout-type">Menu Stacked</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="LayoutTheme"
                        id="modernLayout"
                        value="modern"
                        checked={dataLayout === "modern" ? true : false}
                        onChange={() => handleLayoutChange("modern")}
                      />
                      <label htmlFor="modernLayout">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/modern.svg" alt="img" />
                        </span>
                        <span className="layout-type">Modern</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="LayoutTheme"
                        id="transparentLayout"
                        value="transparent"
                        checked={dataLayout === "transparent" ? true : false}
                        onChange={() => handleLayoutChange("transparent")}
                      />
                      <label htmlFor="transparentLayout">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/transparent.svg" alt="img" />
                        </span>
                        <span className="layout-type">Transparent</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <Link onChange={() => dispatch(setRtl('layout-mode-rtl'))} to={all_routes.layoutRtl} className="theme-layout mb-3">
                      <span className="d-block mb-2 layout-img">
                        <ImageWithBasePath src="assets/img/theme/rtl.svg" alt="img" />
                      </span>
                      <span className="layout-type">RTL</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button
                className="accordion-button text-dark fs-16"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#sidebarsetting"
                aria-expanded="true"
              >
                Layout Width
              </button>
            </h2>
            <div id="sidebarsetting" className="accordion-collapse collapse show">
              <div className="accordion-body">
                <div className="d-flex align-items-center">
                  <div className="theme-width m-1 me-2">
                    <input
                      type="radio"
                      name="width"
                      id="fluidWidth"
                      value="fluid"
                      checked={dataWidth === "fluid" ? true : false}
                      onChange={() => handleLayoutWidthChange("fluid")}
                    />
                    <label htmlFor="fluidWidth" className="d-block rounded fs-12">
                      Fluid Layout
                    </label>
                  </div>
                  <div className="theme-width m-1">
                    <input
                      type="radio"
                      name="width"
                      id="boxWidth"
                      value="box"
                      checked={dataWidth === "box" ? true : false}
                      onChange={() => handleLayoutWidthChange("box")}
                    />
                    <label htmlFor="boxWidth" className="d-block rounded fs-12">
                      Boxed Layout
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button
                className="accordion-button text-dark fs-16"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#cardsetting"
                aria-expanded="true"
                aria-controls="collapsecustomicon1One"
              >
                Card Layout
              </button>
            </h2>
            <div id="cardsetting" className="accordion-collapse collapse show">
              <div className="accordion-body pb-0">
                <div className="row gx-3">
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="card"
                        id="borderedCard"
                        value="bordered"
                        checked={dataCard === "bordered" ? true : false}
                        onChange={() => handleBorderChange("bordered")}
                      />
                      <label htmlFor="borderedCard">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/bordered.svg" alt="img" />
                        </span>
                        <span className="layout-type">Bordered</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="card"
                        id="borderlessCard"
                        value="borderless"
                        checked={dataCard === "borderless" ? true : false}
                        onChange={() => handleBorderChange("borderless")}
                      />
                      <label htmlFor="borderlessCard">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/borderless.svg" alt="img" />
                        </span>
                        <span className="layout-type">Borderless</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="card"
                        id="shadowCard"
                        value="shadow"
                        checked={dataCard === "shadow" ? true : false}
                        onChange={() => handleBorderChange("shadow")}
                      />
                      <label htmlFor="shadowCard">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/shadow.svg" alt="img" />
                        </span>
                        <span className="layout-type">Only Shadow</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button
                className="accordion-button text-dark fs-16"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#sidebarsetting"
                aria-expanded="true"
              >
                Sidebar Color
              </button>
            </h2>
            <div id="sidebarsetting" className="accordion-collapse collapse show">
              <div className="accordion-body">
                <div className="d-flex align-items-center">
                  <div className="theme-colorselect m-1 me-2">
                    <input
                      type="radio"
                      name="sidebar"
                      id="lightSidebar"
                      value="light"
                      checked={dataSidebar === "light" ? true : false}
                      onChange={() => handleDataSidebarChange("light")}
                    />
                    <label
                      htmlFor="lightSidebar"
                      className="d-block rounded mb-2"
                    ></label>
                  </div>
                  <div className="theme-colorselect m-1 me-2">
                    <input
                      type="radio"
                      name="sidebar"
                      id="darkgreenSidebar"
                      value="darkgreen"
                      checked={dataSidebar === "darkgreen" ? true : false}
                      onChange={() => handleDataSidebarChange("darkgreen")}
                    />
                    <label
                      htmlFor="darkgreenSidebar"
                      className="d-block rounded bg-darkgreen mb-2"
                    ></label>
                  </div>
                  <div className="theme-colorselect m-1 me-2">
                    <input
                      type="radio"
                      name="sidebar"
                      id="nightblueSidebar"
                      value="nightblue"
                      checked={dataSidebar === "nightblue" ? true : false}
                      onChange={() => handleDataSidebarChange("nightblue")}
                    />
                    <label
                      htmlFor="nightblueSidebar"
                      className="d-block rounded bg-nightblue mb-2"
                    ></label>
                  </div>
                  <div className="theme-colorselect m-1 me-2">
                    <input
                      type="radio"
                      name="sidebar"
                      id="darkgraySidebar"
                      value="darkgray"
                      checked={dataSidebar === "darkgray" ? true : false}
                      onChange={() => handleDataSidebarChange("darkgray")}
                    />
                    <label
                      htmlFor="darkgraySidebar"
                      className="d-block rounded bg-darkgray mb-2"
                    ></label>
                  </div>
                  <div className="theme-colorselect m-1 me-2">
                    <input
                      type="radio"
                      name="sidebar"
                      id="royalblueSidebar"
                      value="royalblue"
                      checked={dataSidebar === "royalblue" ? true : false}
                      onChange={() => handleDataSidebarChange("royalblue")}
                    />
                    <label
                      htmlFor="royalblueSidebar"
                      className="d-block rounded bg-royalblue mb-2"
                    ></label>
                  </div>
                  <div className="theme-colorselect m-1 me-2">
                    <input
                      type="radio"
                      name="sidebar"
                      id="indigoSidebar"
                      value="indigo"
                      checked={dataSidebar === "indigo" ? true : false}
                      onChange={() => handleDataSidebarChange("indigo")}
                    />
                    <label
                      htmlFor="indigoSidebar"
                      className="d-block rounded bg-indigo mb-2"
                    ></label>
                  </div>
                 
                  
                </div>
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button
                className="accordion-button text-dark fs-16"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#modesetting"
                aria-expanded="true"
              >
                Color Mode
              </button>
            </h2>
            <div id="modesetting" className="accordion-collapse collapse show">
              <div className="accordion-body">
                <div className="row gx-3">
                  <div className="col-6">
                    <div className="theme-mode">
                      <input
                        type="radio"
                        name="theme"
                        id="lightTheme"
                        value="light"
                        checked={dataTheme === "light" ? true : false}
                        onChange={() => handleDataThemeChange("light")}
                      />
                      <label
                        htmlFor="lightTheme"
                        className="p-2 rounded fw-medium w-100"
                      >
                        <span className="avatar avatar-md d-inline-flex rounded me-2">
                          <i className="ti ti-sun-filled" />
                        </span>
                        Light Mode
                      </label>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="theme-mode">
                      <input
                        type="radio"
                        name="theme"
                        id="darkTheme"
                        value="dark"
                        checked={dataTheme === "dark" ? true : false}
                        onChange={() => handleDataThemeChange("dark")}
                      />
                      <label
                        htmlFor="darkTheme"
                        className="p-2 rounded fw-medium w-100"
                      >
                        <span className="avatar avatar-md d-inline-flex rounded me-2">
                          <i className="ti ti-moon-filled" />
                        </span>
                        Dark Mode
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button
                className="accordion-button text-dark fs-16"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#sizesetting"
                aria-expanded="true"
                aria-controls="collapsecustomicon1One"
              >
                Sidebar Size
              </button>
            </h2>
            <div id="sizesetting" className="accordion-collapse collapse show">
              <div className="accordion-body pb-0">
                <div className="row gx-3">
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="size"
                        id="defaultSize"
                        value="default"
                        checked={dataLayout === "default" ? true : false}
                        onChange={() => handleLayoutChange("default")}
                      />
                      <label htmlFor="defaultSize">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/default.svg" alt="img" />
                        </span>
                        <span className="layout-type">Default</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="size"
                        id="compactSize"
                        value="mini"
                        checked={dataLayout === "mini" ? true : false}
                        onChange={() => handleLayoutChange("mini")}
                      />
                      <label htmlFor="compactSize">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/compact.svg" alt="img" />
                        </span>
                        <span className="layout-type">Compact</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="theme-layout mb-3">
                      <input
                        type="radio"
                        name="size"
                        id="hoverviewSize"
                        value="hoverview"
                        checked={dataLayout === "hoverview" ? true : false}
                        onChange={() => handleLayoutChange("hoverview")}
                      />
                      <label htmlFor="hoverviewSize">
                        <span className="d-block mb-2 layout-img">
                          <ImageWithBasePath src="assets/img/theme/hoverview.svg" alt="img" />
                        </span>
                        <span className="layout-type">Hover View</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button
                className="accordion-button text-dark fs-16"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#colorsetting"
                aria-expanded="true"
              >
                Top Bar Color
              </button>
            </h2>
            <div id="colorsetting" className="accordion-collapse collapse show">
              <div className="accordion-body pb-1">
                <div className="d-flex align-items-center flex-wrap gap-3">
                  <div className="theme-colorselect">
                    <input
                      type="radio"
                      name="topbar"
                      id="whiteTopbar"
                      value="white"
                      checked={dataTopBar === "white" ? true : false}
                      onChange={() => handleTopBarColorChange("white")}
                    />
                    <label htmlFor="whiteTopbar" className="white-topbar" />
                  </div>
                  <div className="theme-colorselect">
                    <input
                      type="radio"
                      name="topbar"
                      id="darkaquaTopbar"
                      value="darkaqua"
                      checked={dataTopBar === "darkaqua" ? true : false}
                      onChange={() => handleTopBarColorChange("darkaqua")}
                    />
                    <label htmlFor="darkaquaTopbar" className="darkaqua-topbar" />
                  </div>
                  <div className="theme-colorselect">
                    <input
                      type="radio"
                      name="topbar"
                      id="whiterockTopbar"
                      value="whiterock"
                      checked={dataTopBar === "whiterock" ? true : false}
                      onChange={() => handleTopBarColorChange("whiterock")}
                    />
                    <label
                      htmlFor="whiterockTopbar"
                      className="whiterock-topbar"
                    />
                  </div>
                  <div className="theme-colorselect ">
                    <input
                      type="radio"
                      name="topbar"
                      id="rockblueTopbar"
                      value="rockblue"
                      checked={dataTopBar === "rockblue" ? true : false}
                      onChange={() => handleTopBarColorChange("rockblue")}
                    />
                    <label htmlFor="rockblueTopbar" className="rockblue-topbar" />
                  </div>
                  <div className="theme-colorselect ">
                    <input
                      type="radio"
                      name="topbar"
                      id="bluehazeTopbar"
                      value="bluehaze"
                      checked={dataTopBar === "bluehaze" ? true : false}
                      onChange={() => handleTopBarColorChange("bluehaze")}
                    />
                    <label htmlFor="bluehazeTopbar" className="bluehaze-topbar" />
                  </div>
                  <div className="theme-colorselect">
                    <input
                      type="radio"
                      name="topbar"
                      id="orangeGradientTopbar"
                      value="orangegradient"
                      checked={dataTopBar === "orangegradient" ? true : false}
                      onChange={() => handleTopBarColorChange("orangegradient")}
                    />
                    <label
                      htmlFor="orangeGradientTopbar"
                      className="orange-gradient-topbar"
                    />
                  </div>
                  <div className="theme-colorselect ">
                    <input
                      type="radio"
                      name="topbar"
                      id="purpleGradientTopbar"
                      value="purplegradient"
                      checked={dataTopBar === "purplegradient" ? true : false}
                      onChange={() => handleTopBarColorChange("purplegradient")}
                    />
                    <label
                      htmlFor="purpleGradientTopbar"
                      className="purple-gradient-topbar"
                    />
                  </div>
                  <div className="theme-colorselect">
                    <input
                      type="radio"
                      name="topbar"
                      id="blueGradientTopbar"
                      value="bluegradient"
                      checked={dataTopBar === "bluegradient" ? true : false}
                      onChange={() => handleTopBarColorChange("bluegradient")}
                    />
                    <label
                      htmlFor="blueGradientTopbar"
                      className="blue-gradient-topbar"
                    />
                  </div>
                  <div className="theme-colorselect">
                    <input
                      type="radio"
                      name="topbar"
                      id="maroonGradientTopbar"
                      value="maroongradient"
                      checked={dataTopBar === "maroongradient" ? true : false}
                      onChange={() => handleTopBarColorChange("maroongradient")}
                    />
                    <label
                      htmlFor="maroonGradientTopbar"
                      className="maroon-gradient-topbar"
                    />
                  </div>
                  
                  
                </div>
              </div>
            </div>
          </div>
     
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button
                className="accordion-button text-dark fs-16"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#sidebarcolor"
                aria-expanded="true"
              >
                Theme Colors
              </button>
            </h2>
            <div id="sidebarcolor" className="accordion-collapse collapse show">
              <div className="accordion-body pb-2">
                <div className="d-flex align-items-center flex-wrap gap-3">
                  <div className="theme-colorsset ">
                    <input
                      type="radio"
                      name="color"
                      id="primaryColor"
                      value="primary"
                      checked={dataColor === "primary" ? true : false}
                      onChange={() => handleDataColorChange("primary")}
                    />
                    <label htmlFor="primaryColor" className="primary-clr" />
                  </div>
                  <div className="theme-colorsset ">
                    <input
                      type="radio"
                      name="color"
                      id="brightblueColor"
                      value="brightblue"
                      checked={dataColor === "brightblue" ? true : false}
                      onChange={() => handleDataColorChange("brightblue")}
                    />
                    <label htmlFor="brightblueColor" className="brightblue-clr" />
                  </div>
                  <div className="theme-colorsset ">
                    <input
                      type="radio"
                      name="color"
                      id="lunargreenColor"
                      value="lunargreen"
                      checked={dataColor === "lunargreen" ? true : false}
                      onChange={() => handleDataColorChange("lunargreen")}
                    />
                    <label htmlFor="lunargreenColor" className="lunargreen-clr" />
                  </div>
                  <div className="theme-colorsset ">
                    <input
                      type="radio"
                      name="color"
                      id="lavendarColor"
                      value="lavendar"
                      checked={dataColor === "lavendar" ? true : false}
                      onChange={() => handleDataColorChange("lavendar")}
                    />
                    <label htmlFor="lavendarColor" className="lavendar-clr" />
                  </div>
                  <div className="theme-colorsset ">
                    <input
                      type="radio"
                      name="color"
                      id="magentaColor"
                      value="magenta"
                      checked={dataColor === "magenta" ? true : false}
                      onChange={() => handleDataColorChange("magenta")}
                    />
                    <label htmlFor="magentaColor" className="magenta-clr" />
                  </div>
                  <div className="theme-colorsset ">
                    <input
                      type="radio"
                      name="color"
                      id="chromeyellowColor"
                      value="chromeyellow"
                      checked={dataColor === "chromeyellow" ? true : false}
                      onChange={() => handleDataColorChange("chromeyellow")}
                    />
                    <label
                      htmlFor="chromeyellowColor"
                      className="chromeyellow-clr"
                    />
                  </div>
                  <div className="theme-colorsset ">
                    <input
                      type="radio"
                      name="color"
                      id="lavaredColor"
                      value="lavared"
                      checked={dataColor === "lavared" ? true : false}
                      onChange={() => handleDataColorChange("lavared")}
                    />
                    <label htmlFor="lavaredColor" className="lavared-clr" />
                  </div>
                  
                  
                </div>
              </div>
            </div>
          </div>
         
        </div>
      </div>
      <div className="p-3 pt-0">
        <div className="row gx-3">
          <div className="col-6">
            <Link
              to="#"
              id="resetbutton"
              className="btn btn-light close-theme w-100"
              onClick={handleReset}
            >
              <i className="ti ti-restore me-1" />
              Reset
            </Link>
          </div>
          <div className="col-6">
            <Link
              to="#"
              className="btn btn-primary w-100"
              data-bs-dismiss="offcanvas"
              onClick={buyNow}
            >
              <i className="ti ti-shopping-cart-plus me-1" />
              Buy Product
            </Link>
          </div>
        </div>
      </div>
    </div>
  </>
  
  );
};

export default ThemeSettings;
