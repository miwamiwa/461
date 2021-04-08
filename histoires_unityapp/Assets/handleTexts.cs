using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class handleTexts : MonoBehaviour
{
    public OSC osc;
    public GameObject testText;
    // Start is called before the first frame update
    void Start()
    {
        osc = GameObject.Find("oscinput").GetComponent<OSC>();

        // RECEIVE
        osc.SetAddressHandler("/test", GotText);


        // SEND 
        /*
         * 
         OscMessage message = new OscMessage();

        message.address = "/UpdateXYZ";
        message.values.Add(transform.position.x);
        message.values.Add(transform.position.y);
        message.values.Add(transform.position.z);
        osc.Send(message);
         * */
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    void GotText(OscMessage message)
    {
        /*
        string mess = message.ToString();
        string[] split = mess.Split((char)' ');
        mess = split[1];
        Debug.Log(mess);
        TMPro.TMP_Text tm = testText.GetComponent<TMPro.TMP_Text>();
        Debug.Log(tm);
        tm.text = mess;
        */
    }
}
