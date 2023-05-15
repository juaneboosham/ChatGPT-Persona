import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import arrowKeyImg from "../../public/persona/arrow_key.png";
import btnImg from "../../public/persona/btn.webp";
import enterImg from "../../public/persona/enter.webp";
import escImg from "../../public/persona/esc.webp";
import personas from "../../public/personas.json";
import { createMessage, createPresetMessage, useChatStore } from "../store";
import { useMobileScreen } from "../utils";
import styles from "./persona.module.scss";
import Locale from "../locales";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";

interface Persona {
  id: number;
  avatarUrl: string;
  presetContent: string;
  persona: string;
  sayHi: string;
}

const personaIconWidth = 48;
const personaIconHeight = 48;

export function Persona() {
  const navigate = useNavigate();
  const [curPersona, setCurPersona] = useState(personas?.[0]);
  const [shake, setShake] = useState(false);
  const chatStore = useChatStore();
  const personaWrapperRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
    if (e.key === "Enter") {
      choosePersona();
    }
    if (e.key === "ArrowUp") {
      const index = personas.indexOf(curPersona);
      const { curRow, col } = calPosition(index);
      if (curRow !== 1) {
        const nextIndex = index - col < 0 ? 0 : index - col;
        onHover(personas[nextIndex]);
      }
    }
    if (e.key === "ArrowDown") {
      const index = personas.indexOf(curPersona);
      const { curRow, row, col } = calPosition(index);
      if (curRow !== row) {
        const nextIndex =
          index + col > personas.length - 1 ? personas.length - 1 : index + col;
        onHover(personas[nextIndex]);
      }
    }

    if (e.key === "ArrowLeft") {
      const index = personas.indexOf(curPersona);
      const { curCol } = calPosition(index);
      if (curCol !== 1) {
        const nextIndex = index - 1 < 0 ? 0 : index - 1;
        onHover(personas[nextIndex]);
      }
    }
    if (e.key === "ArrowRight") {
      const index = personas.indexOf(curPersona);
      const { curCol, col } = calPosition(index);
      if (curCol !== col) {
        const nextIndex =
          index + 1 > personas.length - 1 ? personas.length - 1 : index + 1;
        onHover(personas[nextIndex]);
      }
    }

    function calPosition(index: number) {
      const personaListBox = personaWrapperRef.current;
      const boxWidth = personaListBox?.offsetWidth || 0;
      const aMargin = 10;
      const col = Math.floor(boxWidth / (personaIconWidth + aMargin * 2));
      const boxHeight = personaListBox?.offsetHeight || 0;
      const row = Math.floor(boxHeight / (personaIconHeight + aMargin * 2));
      const curRow = Math.ceil((index + 1) / col);
      const curCol = index + 1 - (curRow - 1) * col;
      return { curRow, row, col, curCol };
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curPersona]);

  const newPresetSession = (persona: Persona) => {
    // const presetUserMessage = createPresetMessage({
    //   role: "user",
    //   content: persona.presetContent,
    // });
    const botSayHiMessage = createMessage({
      role: "assistant",
      content: persona.sayHi,
    });
    // const presetMessages = [presetUserMessage, botSayHiMessage];
    const presetMessages = [botSayHiMessage];
    chatStore.newPresetSession(
      persona.avatarUrl,
      presetMessages,
      persona.persona,
    );
    chatStore.onUserInput(persona.presetContent, true);
  };

  const onClose = () => navigate(Path.Home);

  const choosePersona = () => {
    setShake(true);
    setTimeout(() => {
      newPresetSession(curPersona);
      onClose();
    }, 500);
  };

  const onHover = (persona: Persona) => {
    setShake(false);
    setCurPersona(persona);
  };

  const isMobileScreen = useMobileScreen();

  return (
    <div id="persona" className="modal-mask">
      <div className={styles["persona-wrapper"]}>
        <div className={styles["escape-btn"]} onClick={onClose}>
          <Image
            src={escImg}
            alt="Picture of the author"
            width={65}
            height={55}
          />
        </div>
        <div className={styles["persona-list-wrapper"]}>
          {!isMobileScreen && (
            <div className={styles["persona-list-desc"]}>
              <div>
                <span>{Locale.Persona.Use}</span>
                <span className={styles["persona-list-desc-img"]}>
                  <Image
                    src={arrowKeyImg}
                    alt="Picture of the author"
                    fill={true}
                  />
                </span>
                <span>{Locale.Persona.ViewPersona}</span>
              </div>
              <div>
                <span>{Locale.Persona.Press}</span>
                <span className={styles["persona-list-desc-img"]}>
                  <Image
                    src={enterImg}
                    alt="Picture of the author"
                    fill={true}
                  />
                </span>
                <span>{Locale.Persona.Confirm}</span>
              </div>
            </div>
          )}
          <div className={styles["persona-list-item-wrapper"]}>
            <div className={styles["persona-list"]} ref={personaWrapperRef}>
              {personas.map((persona) => {
                return (
                  <span
                    key={persona.id}
                    className={`${styles["persona-item"]} ${
                      curPersona === persona ? styles["persona-item-hover"] : ""
                    } ${
                      curPersona === persona && shake ? styles["shake"] : ""
                    }`}
                    onClick={() => onHover(persona)}
                  >
                    <Image
                      src={persona.avatarUrl}
                      alt="Picture of the author"
                      width={personaIconWidth}
                      height={personaIconHeight}
                    />
                  </span>
                );
              })}
            </div>
          </div>
          <div className={styles["persona-choose-wrapper"]}>
            <div
              className={styles["persona-choose-btn"]}
              onClick={choosePersona}
            >
              {!isMobileScreen && (
                <span className={styles["persona-btn-desc"]}>
                  {Locale.Persona.ChoosePersona}&nbsp;&crarr;
                </span>
              )}
              <div className={styles["persona-btn-desc-img"]}>
                <Image
                  src={btnImg}
                  alt="Picture of the author"
                  fill={true}
                  priority={true}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={styles["persona-preview"]} key={curPersona.id}>
          <div className={styles["persona-image-wrapper"]}>
            <div className={styles["persona-image"]}>
              <Image
                src={curPersona.avatarUrl}
                fill={true}
                alt={curPersona.sayHi}
                priority={true}
              ></Image>
            </div>
          </div>
          <div className={styles["persona-desc"]}>
            <p className={styles["persona-desc-title"]}>{curPersona.persona}</p>
            <p>{curPersona.sayHi}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
